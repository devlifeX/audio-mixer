//go:build js && wasm
// +build js,wasm

package main

import (
	"encoding/base64"
	"fmt"
	"strings"
	"syscall/js"
)

func main() {
	c := make(chan struct{}, 0)

	// Register our mix audio function to be called from JavaScript
	js.Global().Set("mixAudio", js.FuncOf(mixAudio))

	fmt.Println("WASM Audio Mixer initialized")
	<-c
}

// mixAudio takes two audio files and mixes them, with the second as background music
func mixAudio(this js.Value, args []js.Value) interface{} {
	// Check if we have the right number of arguments (now 4 with duration)
	if len(args) < 3 || len(args) > 4 {
		return errorResult("Expected 3-4 arguments: mainAudioData, bgAudioData, volume, and optional duration")
	}

	mainAudioBase64 := args[0].String()
	bgAudioBase64 := args[1].String()
	volume := args[2].Float()

	// Get duration if provided, otherwise use 0 (which means use default duration)
	var duration float64 = 0
	if len(args) >= 4 && !args[3].IsUndefined() && !args[3].IsNull() {
		duration = args[3].Float()
	}

	// Create a promise to return to JavaScript
	promiseConstructor := js.Global().Get("Promise")
	return promiseConstructor.New(js.FuncOf(func(this js.Value, promiseArgs []js.Value) interface{} {
		resolve := promiseArgs[0]
		reject := promiseArgs[1]

		go func() {
			defer func() {
				if r := recover(); r != nil {
					errorMsg := fmt.Sprintf("Panic in WASM: %v", r)
					reject.Invoke(js.ValueOf(errorMsg))
				}
			}()

			// Extract file format information from base64 data
			mainFormat, mainData, mainErr := parseBase64Data(mainAudioBase64)
			if mainErr != nil {
				reject.Invoke(js.ValueOf(fmt.Sprintf("Error parsing main audio: %v", mainErr)))
				return
			}

			bgFormat, bgData, bgErr := parseBase64Data(bgAudioBase64)
			if bgErr != nil {
				reject.Invoke(js.ValueOf(fmt.Sprintf("Error parsing background audio: %v", bgErr)))
				return
			}

			// Create the ffmpeg command for mixing
			command := buildFFmpegCommand(mainFormat, bgFormat, volume, duration)

			// Return an object with the command and file data
			result := map[string]interface{}{
				"command":         command,
				"mainAudioData":   mainData,
				"mainAudioFormat": mainFormat,
				"bgAudioData":     bgData,
				"bgAudioFormat":   bgFormat,
				"volume":          volume,
				"duration":        duration,
			}

			resolve.Invoke(js.ValueOf(result))
		}()

		return nil
	}))
}

// parseBase64Data extracts the format and actual data from a base64 string
func parseBase64Data(dataUrl string) (string, string, error) {
	if !strings.Contains(dataUrl, ";base64,") {
		return "", "", fmt.Errorf("invalid data URL format")
	}

	// Split the data URL to get the MIME type and base64 data
	parts := strings.Split(dataUrl, ";base64,")
	if len(parts) != 2 {
		return "", "", fmt.Errorf("invalid data URL format")
	}

	mimeType := strings.TrimPrefix(parts[0], "data:")
	base64Data := parts[1]

	// Extract format from MIME type
	format := "unknown"
	switch {
	case strings.Contains(mimeType, "audio/wav"), strings.Contains(mimeType, "audio/x-wav"):
		format = "wav"
	case strings.Contains(mimeType, "audio/mpeg"):
		format = "mp3"
	case strings.Contains(mimeType, "audio/ogg"):
		format = "ogg"
	case strings.Contains(mimeType, "audio/aac"):
		format = "aac"
	case strings.Contains(mimeType, "audio/flac"):
		format = "flac"
	case strings.Contains(mimeType, "video/mp4"):
		format = "mp4"
	case strings.Contains(mimeType, "video/x-msvideo"):
		format = "avi"
	case strings.Contains(mimeType, "video/webm"):
		format = "webm"
	case strings.Contains(mimeType, "video/quicktime"):
		format = "mov"
	}

	// Validate the base64 data
	_, err := base64.StdEncoding.DecodeString(base64Data)
	if err != nil {
		return "", "", fmt.Errorf("invalid base64 data: %v", err)
	}

	return format, base64Data, nil
}

// buildFFmpegCommand creates the appropriate FFmpeg command for mixing the audio files
// Now with duration parameter
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

// Return an error as a rejected promise
func errorResult(msg string) js.Value {
	promiseConstructor := js.Global().Get("Promise")
	return promiseConstructor.Call("reject", js.ValueOf(msg))
}
