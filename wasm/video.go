//go:build js && wasm
// +build js,wasm

package main

import (
	"encoding/base64"
	"fmt"
	"strings"
)

// processVideoCreation processes video creation using in-memory operations
func processVideoCreation(audioData string, imageDataArray []ImageData, settings VideoSettings) ([]byte, error) {
	logInfo("Processing video creation")
	logDebug("video", "Settings: %+v", settings)
	logDebug("video", "Number of images: %d", len(imageDataArray))

	// Extract audio data
	audioParts := strings.SplitN(audioData, ";base64,", 2)
	if len(audioParts) != 2 {
		return nil, fmt.Errorf("invalid audio data format")
	}
	audioBytes, err := base64.StdEncoding.DecodeString(audioParts[1])
	if err != nil {
		return nil, fmt.Errorf("failed to decode audio data: %w", err)
	}

	// Process images
	updateProgress(10)
	imageInfos := make([]map[string]interface{}, 0, len(imageDataArray))

	for i, imageData := range imageDataArray {
		// Extract image data
		imageParts := strings.SplitN(imageData.Data, ";base64,", 2)
		if len(imageParts) != 2 {
			return nil, fmt.Errorf("invalid image data format for image %d", i)
		}

		// Add to image info array for JavaScript processing
		imageInfos = append(imageInfos, map[string]interface{}{
			"data":     imageData.Data,
			"duration": imageData.Duration,
		})
		// Update progress
		progress := 10 + (i+1)*40/len(imageDataArray)
		updateProgress(progress)
	}

	// Build command for logging purposes
	command := buildVideoCommand(settings, len(imageDataArray))
	logDebug("ffmpeg", "Video command (not executed in browser): %s", command)

	// In a browser environment, we can't use actual FFmpeg
	// Instead, we'll use JavaScript APIs through a bridge function
	updateProgress(50)

	// Call JavaScript function to create video
	result, err := createVideoInJS(audioBytes, imageInfos, settings)
	if err != nil {
		return nil, fmt.Errorf("failed to create video in JavaScript: %w", err)
	}

	updateProgress(100)
	return result, nil
}

// createVideoInJS calls a JavaScript function to create video using browser APIs
func createVideoInJS(audioBytes []byte, imageInfos []map[string]interface{}, settings VideoSettings) ([]byte, error) {
	// This is a placeholder for actual JavaScript interop
	// In a real implementation, you would call a JavaScript function to create the video

	// For now, we'll just simulate progress
	for i := 60; i <= 90; i += 10 {
		updateProgress(i)
		// Simulate processing time
	}

	// Create a dummy video file (this would be the actual video in a real implementation)
	dummyVideo := []byte("This is a dummy video file")
	updateProgress(95)

	return dummyVideo, nil
}

// buildVideoCommand builds the FFmpeg command for video creation (for reference only)
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
	command += fmt.Sprintf(" output.%s", settings.Format)

	return command
}
