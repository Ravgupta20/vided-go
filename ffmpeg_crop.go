package main

import (
	"flag"
	"fmt"
	"os"
)

// cropExact crops width x height out of input starting at (x, y).
func cropExact(input, output string, width, height, x, y int) error {
	if err := ensureParentDir(output); err != nil {
		return err
	}
	filter := fmt.Sprintf("crop=%d:%d:%d:%d", width, height, x, y)
	return runFFmpeg("-y", "-i", input, "-vf", filter, output)
}

// cropCenter crops width x height out of the exact center of input.
func cropCenter(input, output string, width, height int) error {
	if err := ensureParentDir(output); err != nil {
		return err
	}
	filter := fmt.Sprintf("crop=%d:%d", width, height)
	return runFFmpeg("-y", "-i", input, "-vf", filter, output)
}

// cropEdges trims padX pixels off the left/right and padY off the top/bottom.
func cropEdges(input, output string, padX, padY int) error {
	if err := ensureParentDir(output); err != nil {
		return err
	}
	filter := fmt.Sprintf("crop=iw-%d:ih-%d:%d:%d", padX*2, padY*2, padX, padY)
	return runFFmpeg("-y", "-i", input, "-vf", filter, output)
}

func cmdCrop(args []string) {
	if len(args) == 0 {
		fmt.Fprintln(os.Stderr, "crop: expected a subcommand: exact, center, or edges")
		os.Exit(1)
	}

	switch args[0] {
	case "exact":
		fs := flag.NewFlagSet("crop exact", flag.ExitOnError)
		input := fs.String("input", "", "input image file (required)")
		output := fs.String("output", "", "output image file (required)")
		width := fs.Int("width", 0, "crop width in pixels (required)")
		height := fs.Int("height", 0, "crop height in pixels (required)")
		x := fs.Int("x", 0, "crop top-left x offset")
		y := fs.Int("y", 0, "crop top-left y offset")
		fs.Parse(args[1:])
		if *input == "" || *output == "" || *width == 0 || *height == 0 {
			fmt.Fprintln(os.Stderr, "crop exact: -input, -output, -width, and -height are all required")
			fs.Usage()
			os.Exit(1)
		}
		if err := cropExact(*input, *output, *width, *height, *x, *y); err != nil {
			fmt.Fprintf(os.Stderr, "crop exact: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Wrote %s\n", *output)

	case "center":
		fs := flag.NewFlagSet("crop center", flag.ExitOnError)
		input := fs.String("input", "", "input image file (required)")
		output := fs.String("output", "", "output image file (required)")
		width := fs.Int("width", 0, "crop width in pixels (required)")
		height := fs.Int("height", 0, "crop height in pixels (required)")
		fs.Parse(args[1:])
		if *input == "" || *output == "" || *width == 0 || *height == 0 {
			fmt.Fprintln(os.Stderr, "crop center: -input, -output, -width, and -height are all required")
			fs.Usage()
			os.Exit(1)
		}
		if err := cropCenter(*input, *output, *width, *height); err != nil {
			fmt.Fprintf(os.Stderr, "crop center: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Wrote %s\n", *output)

	case "edges":
		fs := flag.NewFlagSet("crop edges", flag.ExitOnError)
		input := fs.String("input", "", "input image file (required)")
		output := fs.String("output", "", "output image file (required)")
		padX := fs.Int("pad-x", 0, "pixels to trim off the left and right edges")
		padY := fs.Int("pad-y", 0, "pixels to trim off the top and bottom edges")
		fs.Parse(args[1:])
		if *input == "" || *output == "" {
			fmt.Fprintln(os.Stderr, "crop edges: -input and -output are required")
			fs.Usage()
			os.Exit(1)
		}
		if err := cropEdges(*input, *output, *padX, *padY); err != nil {
			fmt.Fprintf(os.Stderr, "crop edges: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Wrote %s\n", *output)

	default:
		fmt.Fprintf(os.Stderr, "crop: unknown subcommand %q (expected exact, center, or edges)\n", args[0])
		os.Exit(1)
	}
}
