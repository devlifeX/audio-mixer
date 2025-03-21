package main

import (
	"encoding/json"
	"fmt"
	"syscall/js"
)

// VideoSettings represents the settings for video creation
type VideoSettings struct {
	Width    int     `json:"width"`
	Height   int     `json:"height"`
	Format   string  `json:"format"`
	Quality  string  `json:"quality"`
	Duration float64 `json:"duration"`
}

// ImageData represents an image with its duration
type ImageData struct {
	Data     string  `json:"data"`
	Duration float64 `json:"duration"`
}

// Register the createVideo function
func registerVideoFunctions() {
	js.Global().Set("createVideo", js.FuncOf(createVideo))
}

// createVideo creates a video from audio and images
func createVideo(this js.Value, args []js.Value) interface{} {
	// Create a promise
	promiseConstructor := js.Global().Get("Promise")
	return promiseConstructor.New(js.FuncOf(func(this js.Value, promiseArgs []js.Value) interface{} {
		resolve := promiseArgs[0]
		reject := promiseArgs[1]

		// Check arguments
		if len(args) < 3 {
			reject.Invoke("Not enough arguments. Expected audio data, image data array, and settings.")
			return nil
		}

		// We're not using audioData directly in this function, but we'll include it in the result
		audioData := args[0].String()
		imagesArray := args[1]
		settingsObj := args[2]

		// Parse settings
		var settings VideoSettings
		settingsMap := make(map[string]interface{})

		keys := js.Global().Get("Object").Call("keys", settingsObj)
		for i := 0; i < keys.Length(); i++ {
			key := keys.Index(i).String()
			value := settingsObj.Get(key)

			// Handle different types of values
			switch key {
			case "width", "height":
				settingsMap[key] = value.Int()
			case "duration":
				settingsMap[key] = value.Float()
			default:
				settingsMap[key] = value.String()
			}
		}

		// Convert settings map to JSON and then to struct
		settingsJSON, err := json.Marshal(settingsMap)
		if err != nil {
			reject.Invoke(fmt.Sprintf("Failed to parse settings: %v", err))
			return nil
		}

		err = json.Unmarshal(settingsJSON, &settings)
		if err != nil {
			reject.Invoke(fmt.Sprintf("Failed to parse settings: %v", err))
			return nil
		}

		// Parse images
		var images []ImageData
		for i := 0; i < imagesArray.Length(); i++ {
			imgObj := imagesArray.Index(i)
			img := ImageData{
				Data:     imgObj.Get("data").String(),
				Duration: imgObj.Get("duration").Float(),
			}
			images = append(images, img)
		}

		// Generate FFmpeg command for video creation
		command := buildVideoCommand(settings, len(images))

		// Create result object
		result := make(map[string]interface{})
		result["command"] = command
		result["imageCount"] = len(images)
		result["totalDuration"] = settings.Duration
		result["width"] = settings.Width
		result["height"] = settings.Height
		result["audioIncluded"] = len(audioData) > 0 // Use audioData in the result

		// Convert result to JS object
		resultJS := js.Global().Get("Object").New()
		for k, v := range result {
			resultJS.Set(k, v)
		}

		resolve.Invoke(resultJS)
		return nil
	}))
}

// buildVideoCommand generates the FFmpeg command for creating a video from images and audio
func buildVideoCommand(settings VideoSettings, imageCount int) string {
	// Base command for images to video
	command := "-f concat -safe 0 -i concat.txt"

	// Add audio input
	command += " -i mixed_audio.mp3"

	// Video codec and quality settings
	command += " -c:v libx264 -pix_fmt yuv420p"

	// Quality settings based on the provided quality
	switch settings.Quality {
	case "1": // High
		command += " -crf 18"
	case "2": // Medium (default)
		command += " -crf 23"
	case "3": // Low
		command += " -crf 28"
	default:
		command += " -crf 23"
	}

	// Audio codec settings
	command += " -c:a aac -b:a 192k"

	// Ensure the video is only as long as the audio
	command += " -shortest"

	// Scale and pad images to fit the desired dimensions
	command += fmt.Sprintf(" -vf \"scale=%d:%d:force_original_aspect_ratio=decrease,pad=%d:%d:(ow-iw)/2:(oh-ih)/2\"",
		settings.Width, settings.Height, settings.Width, settings.Height)

	// Output filename
	command += " output.mp4"

	return command
}
