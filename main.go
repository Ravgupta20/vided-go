package main

import (
	"bytes"
	"fmt"
	"os/exec"
	"strconv"
	"strings"
)

type InputVid struct {
	filename string
}

func (i *InputVid) Clean() {
	i.filename = strings.ReplaceAll(i.filename, " ", "")
}
func main() {
	// var outputFilename
	var outputAudio string
	var inputVid InputVid
	inputVid.filename = "input.mov"
	// inputVid.Clean()
	// outputFilename = "test_output.mp4"
	outputAudio = "audio_out.mp3"
	// Equivalent to: ffmpeg -i input.mp4 -c:v libx264 -crf 23 output.mp4
	// cmd := copyVid(inputVid.filename, outputFilename, "00:00:05", "")
	cmd := extractAudio(inputVid.filename, outputAudio)
	time, err := getAudioDuration(outputAudio)
	if err == nil {
		fmt.Println("Failed to extract audio")
	}
	fmt.Println(time)
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	cmd.Stdout = &stdout // Captures the version info
	cmd.Stderr = &stderr // Captures any errors

	err = cmd.Run()
	if err != nil {
		fmt.Printf("FFmpeg failed: %v\nError details: %s\n", err, stderr.String())
		return

	}

	// Print the captured version text
	fmt.Println(stdout.String())
	// 	"-c:v", "libx264",
	// 	"-crf", "23",
	// 	"output.mp4",
	// )

}

// Extract Audio Only Slice
func extractAudio(input, outputAudio string) *exec.Cmd {
	args := []string{
		"-y",
		"-i", input,
		"-vn",            // Disable video recording
		"-acodec", "mp3", // Encode audio to MP3
		outputAudio,
	}
	return exec.Command("ffmpeg", args...)
}

// getAudioDuration runs ffprobe and returns the duration in seconds.
func getAudioDuration(filePath string) (float64, error) {
	// Build the ffprobe command arguments
	args := []string{
		"-v", "error",
		"-show_entries", "format=duration",
		"-of", "default=noprint_wrappers=1:nokey=1",
		filePath,
	}

	cmd := exec.Command("ffprobe", args...)

	// Capture both standard output and potential error output
	var outBuffer bytes.Buffer
	var errBuffer bytes.Buffer
	cmd.Stdout = &outBuffer
	cmd.Stderr = &errBuffer

	// Execute the command
	err := cmd.Run()
	if err != nil {
		return 0, fmt.Errorf("ffprobe failed: %v (stderr: %s)", err, errBuffer.String())
	}

	// Clean up whitespace/newlines from the terminal output
	cleanOutput := strings.TrimSpace(outBuffer.String())

	// Parse the string into a floating-point number
	duration, err := strconv.ParseFloat(cleanOutput, 64)
	if err != nil {
		return 0, fmt.Errorf("failed to parse duration '%s': %v", cleanOutput, err)
	}

	return duration, nil
}

// ffmpeg -ss 00:01:30 -to 00:02:15 -i input.mp4 -c copy output.mp4
func copyVid(inputName, outputName string, startTime string, endTime string) *exec.Cmd {
	var args []string

	if startTime != "" {
		args = append(args, "-ss", startTime)
	}

	if endTime != "" {
		args = append(args, "-to", endTime)
	}

	args = append(args, "-i", inputName, "-c", "copy", outputName)

	return exec.Command("ffmpeg", args...)
}
