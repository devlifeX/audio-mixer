//go:build js && wasm
// +build js,wasm

package main

import (
	"encoding/base64"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
)

// processVideoCreation processes the video creation using FFmpeg
func processVideoCreation(audioData string, imageDataArray []ImageData, settings VideoSettings) ([]byte, error) {
	// Create temporary directory
	tempDir, err := ioutil.TempDir("", "video-creation")
	if err != nil {
		return nil, fmt.Errorf("failed to create temp directory: %w", err)
	}
	defer os.RemoveAll(tempDir)

	// Extract audio format and data
	audioParts := strings.SplitN(audioData, ";base64,", 2)
	if len(audioParts) != 2 {
		return nil, fmt.Errorf("invalid audio data format")
	}
	audioBytes, err := base64.StdEncoding.DecodeString(audioParts[1])
	if err != nil {
		return nil, fmt.Errorf("failed to decode audio data: %w", err)
	}

	// Write audio file to disk
	audioPath := filepath.Join(tempDir, "mixed_audio.mp3")
	if err := ioutil.WriteFile(audioPath, audioBytes, 0644); err != nil {
		return nil, fmt.Errorf("failed to write audio file: %w", err)
	}

	// Process images
	updateProgress(10)

	// Write images to disk and create concat file
	concatFilePath := filepath.Join(tempDir, "concat.txt")
	concatFile, err := os.Create(concatFilePath)
	if err != nil {
		return nil, fmt.Errorf("failed to create concat file: %w", err)
	}

	for i, imageData := range imageDataArray {
		// Extract image data
		imageParts := strings.SplitN(imageData.Data, ";base64,", 2)
		if len(imageParts) != 2 {
			return nil, fmt.Errorf("invalid image data format for image %d", i)
		}
		imageBytes, err := base64.StdEncoding.DecodeString(imageParts[1])
		if err != nil {
			return nil, fmt.Errorf("failed to decode image data for image %d: %w", i, err)
		}

		// Write image to disk
		imagePath := filepath.Join(tempDir, fmt.Sprintf("image_%d.jpg", i))
		if err := ioutil.WriteFile(imagePath, imageBytes, 0644); err != nil {
			return nil, fmt.Errorf("failed to write image file for image %d: %w", i, err)
		}

		// Add to concat file
		fmt.Fprintf(concatFile, "file '%s'\n", imagePath)
		fmt.Fprintf(concatFile, "duration %.1f\n", imageData.Duration)

		// Update progress
		progress := 10 + (i+1)*40/len(imageDataArray)
		updateProgress(progress)
	}

	// Close concat file
	concatFile.Close()

	// Build FFmpeg command for video creation
	command := buildVideoCommand(settings, len(imageDataArray))

	logDebug("ffmpeg", "Video command: %s", command)

	// Execute FFmpeg command
	updateProgress(50)

	// This would be replaced with actual FFmpeg execution
	// For now, we'll simulate progress
	for i := 60; i <= 90; i += 10 {
		// In a real implementation, this would be based on actual progress
		updateProgress(i)
		// Simulate processing time
		// In real implementation, this would be removed
	}

	// Read the output file
	updateProgress(95)
	outputPath := filepath.Join(tempDir, "output."+settings.Format)
	outputBytes, err := ioutil.ReadFile(outputPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read output file: %w", err)
	}

	updateProgress(100)
	return outputBytes, nil
}

// buildVideoCommand builds the FFmpeg command for video creation
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
