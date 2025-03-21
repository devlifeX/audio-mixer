//go:build js && wasm
// +build js,wasm

package main

import (
	"encoding/json"
	"fmt"
	"syscall/js"
)

// VideoSettings represents the settings for video creation
type VideoSettings struct {
	Width          int     `json:"width"`
	Height         int     `json:"height"`
	Quality        string  `json:"videoQuality"`
	Format         string  `json:"videoFormat"`
	OutputDuration string  `json:"outputDuration"`
	CustomDuration float64 `json:"customDuration"`
}

// ImageData represents an image with its duration
type ImageData struct {
	Data     string  `json:"data"`
	Duration float64 `json:"duration"`
}

// Global FFmpeg instance
var ffmpeg js.Value

// Main function - entry point for WASM
func main() {
	// Set up channel to keep program running
	c := make(chan struct{})

	// Register functions to be called from JavaScript
	js.Global().Set("mixAudio", js.FuncOf(mixAudio))
	js.Global().Set("createVideo", js.FuncOf(createVideo))

	// Log that WASM has been initialized
	logInfo("WASM module initialized")

	// Keep the program running
	<-c
}

// logDebug logs debug messages to the JavaScript console and debug system
func logDebug(category, message string, args ...interface{}) {
	if len(args) > 0 {
		message = fmt.Sprintf(message, args...)
	}

	// Log to console
	js.Global().Get("console").Call("log", fmt.Sprintf("[WASM] [DEBUG] [%s] %s", category, message))

	// Log to debug system if available
	debugSystem := js.Global().Get("debugSystem")
	if !debugSystem.IsUndefined() && !debugSystem.IsNull() {
		log := debugSystem.Get("log")
		if !log.IsUndefined() && !log.IsNull() {
			debug := log.Get("debug")
			if !debug.IsUndefined() && !debug.IsNull() {
				debug.Invoke(category, message)
			}
		}
	}
}

// logInfo logs info messages to the JavaScript console and debug system
func logInfo(message string, args ...interface{}) {
	if len(args) > 0 {
		message = fmt.Sprintf(message, args...)
	}

	// Log to console
	js.Global().Get("console").Call("log", fmt.Sprintf("[WASM] %s", message))

	// Log to debug system if available
	debugSystem := js.Global().Get("debugSystem")
	if !debugSystem.IsUndefined() && !debugSystem.IsNull() {
		log := debugSystem.Get("log")
		if !log.IsUndefined() && !log.IsNull() {
			info := log.Get("info")
			if !info.IsUndefined() && !info.IsNull() {
				info.Invoke("wasm", message)
			}
		}
	}
}

// logError logs error messages to the JavaScript console and debug system
func logError(message string, err error) {
	errMsg := message
	if err != nil {
		errMsg = fmt.Sprintf("%s: %v", message, err)
	}

	// Log to console
	js.Global().Get("console").Call("error", fmt.Sprintf("[WASM] ERROR: %s", errMsg))

	// Log to debug system if available
	debugSystem := js.Global().Get("debugSystem")
	if !debugSystem.IsUndefined() && !debugSystem.IsNull() {
		log := debugSystem.Get("log")
		if !log.IsUndefined() && !log.IsNull() {
			errorLog := log.Get("error")
			if !errorLog.IsUndefined() && !errorLog.IsNull() {
				errorLog.Invoke("wasm", errMsg)
			}
		}
	}
}

// updateProgress updates the progress in the UI
func updateProgress(percent int) {
	// Update UI progress through JavaScript
	js.Global().Get("console").Call("log", fmt.Sprintf("Progress: %d%%", percent))

	// Call updateUI.progressBar if it exists
	updateUI := js.Global().Get("updateUI")
	if !updateUI.IsUndefined() && !updateUI.IsNull() {
		progressBar := updateUI.Get("progressBar")
		if !progressBar.IsUndefined() && !progressBar.IsNull() {
			progressBar.Invoke(percent)
		}
	}
}

// mixAudio mixes two audio files with the second as background
func mixAudio(this js.Value, args []js.Value) interface{} {
	// Create a promise to return to JavaScript
	promise := js.Global().Get("Promise").New(js.FuncOf(func(this js.Value, promiseArgs []js.Value) interface{} {
		resolve := promiseArgs[0]
		reject := promiseArgs[1]

		// Validate arguments
		if len(args) < 3 {
			errorMsg := "Not enough arguments. Expected: mainAudio, bgAudio, volume, [duration]"
			logError(errorMsg, nil)
			reject.Invoke(js.Global().Get("Error").New(errorMsg))
			return nil
		}

		// Extract arguments
		mainAudioData := args[0].String()
		bgAudioData := args[1].String()
		volume := args[2].Float()

		// Optional duration parameter
		var duration float64 = 0
		if len(args) > 3 && !args[3].IsNull() && !args[3].IsUndefined() {
			duration = args[3].Float()
		}

		logInfo("Starting audio mixing process")
		logDebug("audio", "Main audio data length: %d, BG audio data length: %d",
			len(mainAudioData), len(bgAudioData))
		logDebug("audio", "Volume: %.2f, Duration: %.2f", volume, duration)

		// Process the audio files
		go func() {
			result, err := processAudioMix(mainAudioData, bgAudioData, volume, duration)
			if err != nil {
				logError("Error processing audio mix", err)
				reject.Invoke(js.Global().Get("Error").New(err.Error()))
				return
			}

			// Create a Uint8Array from the result
			uint8Array := js.Global().Get("Uint8Array").New(len(result))
			js.CopyBytesToJS(uint8Array, result)

			// Create a Blob from the Uint8Array
			blob := js.Global().Get("Blob").New(js.Global().Get("Array").New(uint8Array),
				map[string]interface{}{"type": "audio/mp3"})

			logInfo("Audio mixing completed successfully")
			resolve.Invoke(blob)
		}()

		return nil
	}))

	return promise
}

// createVideo creates a video from audio and images
func createVideo(this js.Value, args []js.Value) interface{} {
	// Create a promise to return to JavaScript
	promise := js.Global().Get("Promise").New(js.FuncOf(func(this js.Value, promiseArgs []js.Value) interface{} {
		resolve := promiseArgs[0]
		reject := promiseArgs[1]

		// Validate arguments
		if len(args) < 3 {
			errorMsg := "Not enough arguments. Expected: audioData, imageDataArray, settings"
			logError(errorMsg, nil)
			reject.Invoke(js.Global().Get("Error").New(errorMsg))
			return nil
		}

		// Extract arguments
		audioData := args[0].String()
		imageDataArrayJS := args[1]
		settingsJS := args[2]

		// Parse settings
		var settings VideoSettings
		settingsJSON := js.Global().Get("JSON").Call("stringify", settingsJS).String()
		if err := json.Unmarshal([]byte(settingsJSON), &settings); err != nil {
			logError("Failed to parse video settings", err)
			reject.Invoke(js.Global().Get("Error").New("Failed to parse video settings: " + err.Error()))
			return nil
		}

		// Parse image data array
		var imageDataArray []ImageData
		imageCount := imageDataArrayJS.Length()
		for i := 0; i < imageCount; i++ {
			imageJS := imageDataArrayJS.Index(i)
			imageData := ImageData{
				Data:     imageJS.Get("data").String(),
				Duration: imageJS.Get("duration").Float(),
			}
			imageDataArray = append(imageDataArray, imageData)
		}

		logInfo("Starting video creation process")
		logDebug("video", "Audio data length: %d, Image count: %d", len(audioData), len(imageDataArray))
		logDebug("video", "Video settings: %+v", settings)

		// Process the video creation
		go func() {
			result, err := processVideoCreation(audioData, imageDataArray, settings)
			if err != nil {
				logError("Error processing video creation", err)
				reject.Invoke(js.Global().Get("Error").New(err.Error()))
				return
			}

			// Create a Uint8Array from the result
			uint8Array := js.Global().Get("Uint8Array").New(len(result))
			js.CopyBytesToJS(uint8Array, result)

			// Create a Blob from the Uint8Array
			blob := js.Global().Get("Blob").New(js.Global().Get("Array").New(uint8Array),
				map[string]interface{}{"type": "video/" + settings.Format})

			logInfo("Video creation completed successfully")
			resolve.Invoke(blob)
		}()

		return nil
	}))

	return promise
}
