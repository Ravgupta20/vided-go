package main

import (
	"flag"
	"fmt"
	"os"
)

// extractSingleFrame grabs the exact frame at timestamp.
func extractSingleFrame(input, timestamp, output string) error {
	if err := ensureParentDir(output); err != nil {
		return err
	}
	return runFFmpeg("-ss", timestamp, "-i", input, "-vframes", "1", "-y", output)
}

// extractBestFrame auto-picks the frame with the most motion/detail.
func extractBestFrame(input, output string) error {
	if err := ensureParentDir(output); err != nil {
		return err
	}
	return runFFmpeg("-i", input, "-vf", "thumbnail", "-vframes", "1", "-y", output)
}

// extractPeriodicFrames writes one frame every intervalSeconds to outputPattern.
func extractPeriodicFrames(input, outputPattern string, intervalSeconds float64) error {
	if err := ensureParentDir(outputPattern); err != nil {
		return err
	}
	return runFFmpeg("-i", input, "-vf", fmt.Sprintf("fps=1/%g", intervalSeconds), "-y", outputPattern)
}

func cmdFrame(args []string) {
	if len(args) == 0 {
		fmt.Fprintln(os.Stderr, "frame: expected a subcommand: single, best, or slides")
		os.Exit(1)
	}

	switch args[0] {
	case "single":
		fs := flag.NewFlagSet("frame single", flag.ExitOnError)
		input := fs.String("input", "", "input video file (required)")
		at := fs.String("at", "", "timestamp to grab, e.g. 00:00:05 (required)")
		output := fs.String("output", "", "output image file (required)")
		fs.Parse(args[1:])
		if *input == "" || *at == "" || *output == "" {
			fmt.Fprintln(os.Stderr, "frame single: -input, -at, and -output are all required")
			fs.Usage()
			os.Exit(1)
		}
		if err := extractSingleFrame(*input, *at, *output); err != nil {
			fmt.Fprintf(os.Stderr, "frame single: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Wrote %s\n", *output)

	case "best":
		fs := flag.NewFlagSet("frame best", flag.ExitOnError)
		input := fs.String("input", "", "input video file (required)")
		output := fs.String("output", "", "output image file (required)")
		fs.Parse(args[1:])
		if *input == "" || *output == "" {
			fmt.Fprintln(os.Stderr, "frame best: -input and -output are required")
			fs.Usage()
			os.Exit(1)
		}
		if err := extractBestFrame(*input, *output); err != nil {
			fmt.Fprintf(os.Stderr, "frame best: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Wrote %s\n", *output)

	case "slides":
		fs := flag.NewFlagSet("frame slides", flag.ExitOnError)
		input := fs.String("input", "", "input video file (required)")
		outputPattern := fs.String("output-pattern", "slides_%03d.png", "output filename pattern, must contain %d")
		interval := fs.Float64("interval", 5, "seconds between extracted frames")
		fs.Parse(args[1:])
		if *input == "" {
			fmt.Fprintln(os.Stderr, "frame slides: -input is required")
			fs.Usage()
			os.Exit(1)
		}
		if err := extractPeriodicFrames(*input, *outputPattern, *interval); err != nil {
			fmt.Fprintf(os.Stderr, "frame slides: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Wrote frames matching %s\n", *outputPattern)

	default:
		fmt.Fprintf(os.Stderr, "frame: unknown subcommand %q (expected single, best, or slides)\n", args[0])
		os.Exit(1)
	}
}
