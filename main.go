package main

import (
	"bytes"
	"fmt"
	"os/exec"
	"strings"
)

type InputVid struct {
	filename string
}

func (i *InputVid) Clean() {
	i.filename = strings.ReplaceAll(i.filename, " ", "")
}
func main() {
	var outputVid string
	var inputVid InputVid
	inputVid.filename = "input.mov"
	inputVid.Clean()
	outputVid = "test_output.mp4"
	// Equivalent to: ffmpeg -i input.mp4 -c:v libx264 -crf 23 output.mp4
	cmd := exec.Command("ffmpeg",
		// "-version",
		"-i", inputVid.filename,
		"-to", "00:00:3", "-c", "copy", outputVid,
	)
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	cmd.Stdout = &stdout // Captures the version info
	cmd.Stderr = &stderr // Captures any errors

	err := cmd.Run()
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
