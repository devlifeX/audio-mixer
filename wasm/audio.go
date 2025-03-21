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

// processAudioMix processes the audio mixing using FFmpeg
func processAudioMix(mainAudioData, bgAudioData string, volume, duration float64) ([]byte, error) {
	// Create temporary directory
	tempDir, err := ioutil.TempDir("", "audio-mix")
	if err != nil {
		return nil, fmt.Errorf("failed to create temp directory: %w", err)
	}
	defer os.RemoveAll(tempDir)

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

	// Write audio files to disk
	mainAudioPath := filepath.Join(tempDir, "main."+mainFormat)
	bgAudioPath := filepath.Join(tempDir, "bg."+bgFormat)
	outputPath := filepath.Join(tempDir, "output.mp3")

	if err := ioutil.WriteFile(mainAudioPath, mainAudioBytes, 0644); err != nil {
		return nil, fmt.Errorf("failed to write main audio file: %w", err)
	}

	if err := ioutil.WriteFile(bgAudioPath, bgAudioBytes, 0644); err != nil {
		return nil, fmt.Errorf("failed to write background audio file: %w", err)
	}

	// Build FFmpeg command
	command := buildFFmpegCommand(mainFormat, bgFormat, volume, duration)

	logDebug("ffmpeg", "Audio command: %s", command)

	// Execute FFmpeg command
	updateProgress(10) // Starting

	// This would be replaced with actual FFmpeg execution
	// For now, we'll simulate progress
	for i := 20; i <= 90; i += 10 {
		// In a real implementation, this would be based on actual progress
		updateProgress(i)
		// Simulate processing time
	}

	// Read the output file
	updateProgress(95)
	outputBytes, err := ioutil.ReadFile(outputPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read output file: %w", err)
	}

	updateProgress(100)
	return outputBytes, nil
}

// buildFFmpegCommand builds the FFmpeg command for audio mixing
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
