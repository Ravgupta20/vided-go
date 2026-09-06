package main

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
)

// runFFmpeg runs ffmpeg with the given args, streaming its output live.
func runFFmpeg(args ...string) error {
	cmd := exec.Command("ffmpeg", args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("ffmpeg failed: %w", err)
	}
	return nil
}

// getMediaDuration returns a media file's duration in seconds via ffprobe.
func getMediaDuration(filePath string) (float64, error) {
	cmd := exec.Command("ffprobe",
		"-v", "error",
		"-show_entries", "format=duration",
		"-of", "default=noprint_wrappers=1:nokey=1",
		filePath,
	)
	var out, errBuf bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &errBuf
	if err := cmd.Run(); err != nil {
		return 0, fmt.Errorf("ffprobe failed: %v (stderr: %s)", err, errBuf.String())
	}

	clean := strings.TrimSpace(out.String())
	duration, err := strconv.ParseFloat(clean, 64)
	if err != nil {
		return 0, fmt.Errorf("failed to parse duration %q: %w", clean, err)
	}
	return duration, nil
}

// ensureParentDir makes sure the directory outputPath will be written into exists.
func ensureParentDir(outputPath string) error {
	dir := filepath.Dir(outputPath)
	if dir == "" || dir == "." {
		return nil
	}
	return os.MkdirAll(dir, 0755)
}

// splitCommaList splits a comma-separated flag value, trimming whitespace
// and dropping empty entries.
func splitCommaList(s string) []string {
	var out []string
	for _, part := range strings.Split(s, ",") {
		part = strings.TrimSpace(part)
		if part != "" {
			out = append(out, part)
		}
	}
	return out
}
