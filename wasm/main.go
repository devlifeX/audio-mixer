package main

import (
	"fmt"
	"strings"
	"syscall/js"
)

func main() {
	c := make(chan struct{}, 0)

	// Register our functions to be called from JavaScript
	js.Global().Set("mixAudio", js.FuncOf(mixAudio))
	registerVideoFunctions()

	fmt.Println("WASM Audio/Video Mixer initialized")
	<-c
}

// mixAudio processes audio data and returns information needed for FFmpeg processing
func mixAudio(this js.Value, args []js.Value) interface{} {
	// Create a promise
	promiseConstructor := js.Global().Get("Promise")
	return promiseConstructor.New(js.FuncOf(func(this js.Value, promiseArgs []js.Value) interface{} {
		resolve := promiseArgs[0]
		reject := promiseArgs[1]

		// Check arguments
		if len(args) < 3 {
			reject.Invoke("Not enough arguments. Expected main audio data, background audio data, and volume.")
			return nil
		}

		mainAudioData := args[0].String()
		bgAudioData := args[1].String()
		volume := args[2].Float()

		// Optional duration argument
		var duration float64 = 0
		if len(args) > 3 && !args[3].IsUndefined() && !args[3].IsNull() {
			duration = args[3].Float()
		}

		// Extract format information from the data URLs
		mainFormat, mainMime, err := parseBase64Data(mainAudioData)
		if err != nil {
			reject.Invoke(fmt.Sprintf("Error parsing main audio data: %v", err))
			return nil
		}

		bgFormat, bgMime, err := parseBase64Data(bgAudioData)
		if err != nil {
			reject.Invoke(fmt.Sprintf("Error parsing background audio data: %v", err))
			return nil
		}

		// Build the FFmpeg command
		command := buildFFmpegCommand(mainFormat, bgFormat, volume, duration)

		// Create result object
		result := make(map[string]interface{})
		result["command"] = command
		result["mainAudioFormat"] = mainFormat
		result["bgAudioFormat"] = bgFormat
		result["mainAudioMime"] = mainMime
		result["bgAudioMime"] = bgMime
		result["volume"] = volume
		if duration > 0 {
			result["duration"] = duration
		}

		// Convert result to JS object
		resultJS := js.Global().Get("Object").New()
		for k, v := range result {
			resultJS.Set(k, v)
		}

		resolve.Invoke(resultJS)
		return nil
	}))
}

// parseBase64Data extracts format and MIME type from a data URL
func parseBase64Data(dataUrl string) (string, string, error) {
	// Check if it's a data URL
	if !strings.HasPrefix(dataUrl, "data:") {
		return "", "", fmt.Errorf("not a data URL")
	}

	// Extract MIME type
	mimeEndIndex := strings.Index(dataUrl, ";base64,")
	if mimeEndIndex == -1 {
		return "", "", fmt.Errorf("invalid data URL format")
	}

	mimeType := dataUrl[5:mimeEndIndex]

	// Determine file format from MIME type
	var format string
	switch {
	case strings.Contains(mimeType, "audio/mpeg"), strings.Contains(mimeType, "audio/mp3"):
		format = "mp3"
	case strings.Contains(mimeType, "audio/wav"), strings.Contains(mimeType, "audio/wave"):
		format = "wav"
	case strings.Contains(mimeType, "audio/ogg"):
		format = "ogg"
	case strings.Contains(mimeType, "audio/aac"):
		format = "aac"
	case strings.Contains(mimeType, "audio/flac"):
		format = "flac"
	case strings.Contains(mimeType, "video/mp4"):
		format = "mp4"
	case strings.Contains(mimeType, "video/webm"):
		format = "webm"
	case strings.Contains(mimeType, "video/ogg"):
		format = "ogv"
	default:
		// Try to extract format from the data itself
		format = detectFormatFromData(dataUrl)
		if format == "" {
			return "", "", fmt.Errorf("unsupported format: %s", mimeType)
		}
	}

	return format, mimeType, nil
}

// detectFormatFromData tries to determine the audio format from the data
func detectFormatFromData(dataUrl string) string {
	// This is a simplified detection. In a real application, you would analyze the file headers.
	if strings.Contains(dataUrl, "audio/mpeg") || strings.Contains(dataUrl, "audio/mp3") {
		return "mp3"
	} else if strings.Contains(dataUrl, "audio/wav") || strings.Contains(dataUrl, "audio/wave") {
		return "wav"
	} else if strings.Contains(dataUrl, "audio/ogg") {
		return "ogg"
	} else if strings.Contains(dataUrl, "audio/aac") {
		return "aac"
	} else if strings.Contains(dataUrl, "audio/flac") {
		return "flac"
	} else if strings.Contains(dataUrl, "video/mp4") {
		return "mp4"
	} else if strings.Contains(dataUrl, "video/webm") {
		return "webm"
	} else if strings.Contains(dataUrl, "video/ogg") {
		return "ogv"
	}
	return ""
}

// buildFFmpegCommand creates the FFmpeg command for audio mixing
func buildFFmpegCommand(mainFormat, bgFormat string, volume float64, duration float64) string {
	// Create a complex FFmpeg command that:
	// 1. Takes both input files
	// 2. Adjusts the volume of the background audio
	// 3. Mixes the two audio streams
	// 4. Encodes the result as MP3

	// Base command
	command := fmt.Sprintf("-i main.%s -i bg.%s", mainFormat, bgFormat)

	// Add duration if specified
	if duration > 0 {
		command += fmt.Sprintf(" -t %.2f", duration)
	}

	// Build filter complex for audio mixing
	filterComplex := fmt.Sprintf("[1:a]volume=%.2f[bg];[0:a][bg]amix=inputs=2:duration=longest:dropout_transition=2", volume)

	// Add filter complex and output options
	command += fmt.Sprintf(" -filter_complex \"%s\" -c:a libmp3lame -q:a 2 output.mp3", filterComplex)

	return command
}

// errorResult returns a rejected promise with an error message
func errorResult(msg string) js.Value {
	promiseConstructor := js.Global().Get("Promise")
	return promiseConstructor.Call("reject", js.ValueOf(msg))
}
