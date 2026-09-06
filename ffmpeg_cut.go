package main

import (
	"flag"
	"fmt"
	"os"
	"time"
)

// cutVideo trims [start, end] out of inputName into outputName via stream
// copy (-c copy) — fast, no re-encode. Either start or end may be empty for
// an open-ended trim.
func cutVideo(inputName, outputName, start, end string) error {
	if err := ensureParentDir(outputName); err != nil {
		return err
	}

	var args []string
	if start != "" {
		args = append(args, "-ss", start)
	}
	if end != "" {
		args = append(args, "-to", end)
	}
	args = append(args, "-i", inputName, "-c", "copy", "-y", outputName)

	return runFFmpeg(args...)
}

// extractAudio pulls the audio track out of input into an MP3 at outputAudio.
func extractAudio(input, outputAudio string) error {
	if err := ensureParentDir(outputAudio); err != nil {
		return err
	}
	return runFFmpeg("-y", "-i", input, "-vn", "-acodec", "mp3", outputAudio)
}

// formatDuration renders a duration as MM:SS.
func formatDuration(d time.Duration) string {
	minutes := int(d.Minutes())
	seconds := int(d.Seconds()) % 60
	return fmt.Sprintf("%02d:%02d", minutes, seconds)
}

// bulkCutWithPad cuts [raw, raw+pad] out of input for each raw "MM:SS"
// timestamp in rawTimers, writing outputPattern (a %d template) for each one.
func bulkCutWithPad(input string, rawTimers []string, pad time.Duration, outputPattern string) error {
	for i, raw := range rawTimers {
		var min, sec int
		if _, err := fmt.Sscanf(raw, "%d:%d", &min, &sec); err != nil {
			return fmt.Errorf("parsing timestamp %q: %w", raw, err)
		}
		start := time.Duration(min)*time.Minute + time.Duration(sec)*time.Second
		end := start + pad
		output := fmt.Sprintf(outputPattern, i)

		fmt.Printf("Cutting %s: %s -> %s (%s)\n", raw, raw, formatDuration(end), output)
		if err := cutVideo(input, output, raw, formatDuration(end)); err != nil {
			return fmt.Errorf("segment %d (%s): %w", i, raw, err)
		}
	}
	return nil
}

func cmdCut(args []string) {
	fs := flag.NewFlagSet("cut", flag.ExitOnError)
	input := fs.String("input", "", "input video file (required)")
	output := fs.String("output", "", "output video file (required)")
	start := fs.String("start", "", "start time, e.g. 00:01:30 (optional)")
	end := fs.String("end", "", "end time, e.g. 00:02:15 (optional)")
	fs.Parse(args)

	if *input == "" || *output == "" {
		fmt.Fprintln(os.Stderr, "cut: -input and -output are required")
		fs.Usage()
		os.Exit(1)
	}
	if *start == "" && *end == "" {
		fmt.Fprintln(os.Stderr, "cut: at least one of -start or -end is required")
		os.Exit(1)
	}

	if err := cutVideo(*input, *output, *start, *end); err != nil {
		fmt.Fprintf(os.Stderr, "cut: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Wrote %s\n", *output)
}

func cmdBulkCut(args []string) {
	fs := flag.NewFlagSet("bulk-cut", flag.ExitOnError)
	input := fs.String("input", "", "input video file (required)")
	timers := fs.String("timers", "", "comma-separated MM:SS timestamps (required)")
	pad := fs.Duration("pad", 2*time.Minute, "duration to add to each timestamp for the segment end")
	outputPattern := fs.String("output-pattern", "segment_%d.mp4", "output filename pattern, must contain %d")
	fs.Parse(args)

	if *input == "" || *timers == "" {
		fmt.Fprintln(os.Stderr, "bulk-cut: -input and -timers are required")
		fs.Usage()
		os.Exit(1)
	}

	if err := bulkCutWithPad(*input, splitCommaList(*timers), *pad, *outputPattern); err != nil {
		fmt.Fprintf(os.Stderr, "bulk-cut: %v\n", err)
		os.Exit(1)
	}
}

func cmdExtractAudio(args []string) {
	fs := flag.NewFlagSet("extract-audio", flag.ExitOnError)
	input := fs.String("input", "", "input video file (required)")
	output := fs.String("output", "", "output mp3 file (required)")
	fs.Parse(args)

	if *input == "" || *output == "" {
		fmt.Fprintln(os.Stderr, "extract-audio: -input and -output are required")
		fs.Usage()
		os.Exit(1)
	}

	if err := extractAudio(*input, *output); err != nil {
		fmt.Fprintf(os.Stderr, "extract-audio: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Wrote %s\n", *output)
}

func cmdProbe(args []string) {
	fs := flag.NewFlagSet("probe", flag.ExitOnError)
	input := fs.String("input", "", "input media file (required)")
	fs.Parse(args)

	if *input == "" {
		fmt.Fprintln(os.Stderr, "probe: -input is required")
		fs.Usage()
		os.Exit(1)
	}

	duration, err := getMediaDuration(*input)
	if err != nil {
		fmt.Fprintf(os.Stderr, "probe: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("%.2f\n", duration)
}
