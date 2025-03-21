//go:build js && wasm
// +build js,wasm

package main

import (
	"encoding/base64"
	"fmt"
	"strings"
)

// processAudioMix processes the audio mixing using in-memory operations
func processAudioMix(mainAudioData, bgAudioData string, volume, duration float64) ([]byte, error) {
	// Extract main audio format and data
	mainParts := strings.SplitN(mainAudioData, ";base64,", 2)
	if len(mainParts) != 2 {
		return nil, fmt.Errorf("invalid main audio data format")
	}
	mainFormat := strings.TrimPrefix(strings.SplitN(mainParts[0], ":", 2)[1], "audio/")
	mainAudioBytes, err := base64.StdEncoding.DecodeString(mainParts[1])
	if err != nil {
		return nil, fmt.Errorf("failed to decode main audio data: %w", err)
	}

	// Extract background audio format and data
	bgParts := strings.SplitN(bgAudioData, ";base64,", 2)
	if len(bgParts) != 2 {
		return nil, fmt.Errorf("invalid background audio data format")
	}
	bgFormat := strings.TrimPrefix(strings.SplitN(bgParts[0], ":", 2)[1], "audio/")
	bgAudioBytes, err := base64.StdEncoding.DecodeString(bgParts[1])
	if err != nil {
		return nil, fmt.Errorf("failed to decode background audio data: %w", err)
	}

	// Log the audio formats and sizes
	logDebug("audio", "Main audio format: %s, size: %d bytes", mainFormat, len(mainAudioBytes))
	logDebug("audio", "Background audio format: %s, size: %d bytes", bgFormat, len(bgAudioBytes))

	// Build FFmpeg command (for logging purposes only in this browser context)
	command := buildFFmpegCommand(mainFormat, bgFormat, volume, duration)
	logDebug("ffmpeg", "Audio command (not executed in browser): %s", command)

	// In a browser environment, we can't use actual FFmpeg
	// Instead, we'll use Web Audio API through JavaScript
	// For now, we'll simulate the progress and return a mock result

	// Execute audio mixing through JavaScript
	updateProgress(10) // Starting

	// Call JavaScript function to mix audio
	result, err := mixAudioInJS(mainAudioBytes, mainFormat, bgAudioBytes, bgFormat, volume, duration)
	if err != nil {
		return nil, fmt.Errorf("failed to mix audio in JavaScript: %w", err)
	}

	updateProgress(100)
	return result, nil
}

// mixAudioInJS calls a JavaScript function to mix audio using Web Audio API
func mixAudioInJS(mainAudio []byte, mainFormat string, bgAudio []byte, bgFormat string, volume, duration float64) ([]byte, error) {
	// This is a placeholder for actual JavaScript interop
	// In a real implementation, you would call a JavaScript function to mix the audio

	// For now, we'll just simulate progress
	for i := 20; i <= 90; i += 10 {
		updateProgress(i)
		// Simulate processing time
	}

	// For demonstration, we'll just return the main audio
	// In a real implementation, this would be the mixed audio
	return mainAudio, nil
}

// buildFFmpegCommand builds the FFmpeg command for audio mixing (for reference only)
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
