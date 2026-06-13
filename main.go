package main

import (
	"bytes"
	"fmt"
	"os/exec"
)

func main() {
	var inputVid string
	// Equivalent to: ffmpeg -i input.mp4 -c:v libx264 -crf 23 output.mp4
	cmd := exec.Command("ffmpeg",
		"-version",
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
	// 	"-i", "input.mp4",
	// 	"-c:v", "libx264",
	// 	"-crf", "23",
	// 	"output.mp4",
	// )

}
