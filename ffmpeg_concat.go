package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"strconv"
	"strings"
)

// concatVideosRobust concatenates inputFiles into outputFile after sanitizing
// each to a common resolution/framerate/pixel format and audio layout, so
// mismatched sources (different codecs, resolutions, frame rates) still merge.
func concatVideosRobust(inputFiles []string, outputFile string) error {
	if len(inputFiles) == 0 {
		return fmt.Errorf("no input files provided for concatenation")
	}
	if err := ensureParentDir(outputFile); err != nil {
		return err
	}

	args := []string{"-y"}
	for _, file := range inputFiles {
		args = append(args, "-i", file)
	}

	var filtergraph strings.Builder
	for i := range inputFiles {
		fmt.Fprintf(&filtergraph,
			"[%d:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p[v%d];",
			i, i,
		)
		fmt.Fprintf(&filtergraph,
			"[%d:a]aformat=channel_layouts=stereo:sample_rates=44100[a%d];",
			i, i,
		)
	}
	for i := range inputFiles {
		fmt.Fprintf(&filtergraph, "[v%d][a%d]", i, i)
	}
	fmt.Fprintf(&filtergraph, "concat=n=%d:v=1:a=1[outv][outa]", len(inputFiles))

	args = append(args,
		"-filter_complex", filtergraph.String(),
		"-map", "[outv]",
		"-map", "[outa]",
		outputFile,
	)

	return runFFmpeg(args...)
}

// overlayConcatOnVideoSanitized overlays a sequence of slide clips (sanitized
// to 1920x1080 @30fps yuv420p) over backgroundVid, keeping the background's audio.
func overlayConcatOnVideoSanitized(backgroundVid string, slideFiles []string, outputFile string) error {
	if len(slideFiles) == 0 {
		return fmt.Errorf("no slide files provided for overlay")
	}
	if err := ensureParentDir(outputFile); err != nil {
		return err
	}

	args := []string{"-y", "-i", backgroundVid}
	for _, file := range slideFiles {
		args = append(args, "-i", file)
	}

	var filtergraph strings.Builder
	for i := range slideFiles {
		slideIdx := i + 1 // index 0 is backgroundVid
		fmt.Fprintf(&filtergraph,
			"[%d:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p[v%d];",
			slideIdx, i,
		)
	}
	for i := range slideFiles {
		fmt.Fprintf(&filtergraph, "[v%d]", i)
	}
	fmt.Fprintf(&filtergraph, "concat=n=%d:v=1:a=0[concated_slides];", len(slideFiles))
	filtergraph.WriteString("[0:v][concated_slides]overlay=0:0:shortest=1[outv]")

	args = append(args,
		"-filter_complex", filtergraph.String(),
		"-map", "[outv]",
		"-map", "0:a",
		"-c:a", "copy",
		outputFile,
	)

	return runFFmpeg(args...)
}

// createVideoAudioAndFrames builds a video from an ffmpeg concat-format image
// timing list (textFile, e.g. exported by the marker UI) plus one audio track.
func createVideoAudioAndFrames(inputAudio, textFile, outputFile string) error {
	if err := ensureParentDir(outputFile); err != nil {
		return err
	}
	return runFFmpeg(
		"-f", "concat",
		"-safe", "0",
		"-i", textFile,
		"-i", inputAudio,
		"-pix_fmt", "yuv420p",
		"-c:v", "libx264", "-c:a", "copy",
		"-shortest",
		"-y",
		outputFile,
	)
}

// concatAudioFiles concatenates audio files by writing a temporary ffmpeg
// concat-list file and running the concat demuxer (stream copy, no re-encode).
func concatAudioFiles(inputFiles []string, outputFile string) error {
	if len(inputFiles) == 0 {
		return fmt.Errorf("no input files provided for audio concat")
	}
	if err := ensureParentDir(outputFile); err != nil {
		return err
	}

	listFile, err := os.CreateTemp("", "vided-go-audio-concat-*.txt")
	if err != nil {
		return fmt.Errorf("failed to create temp concat list: %w", err)
	}
	defer os.Remove(listFile.Name())
	defer listFile.Close()

	for _, file := range inputFiles {
		// Must be absolute: the concat demuxer resolves relative paths in the
		// list file against the list file's own directory (the OS temp dir
		// here), not the caller's working directory.
		abs, err := filepath.Abs(file)
		if err != nil {
			return fmt.Errorf("resolving path %q: %w", file, err)
		}
		if _, err := fmt.Fprintf(listFile, "file '%s'\n", abs); err != nil {
			return fmt.Errorf("failed writing concat list: %w", err)
		}
	}
	listFile.Sync()

	return runFFmpeg(
		"-f", "concat",
		"-safe", "0",
		"-i", listFile.Name(),
		"-c:a", "copy",
		"-y",
		outputFile,
	)
}

// sortedNumberedVideos returns the .mp4 files directly inside dir, sorted
// numerically by filename (e.g. "2.mp4" before "10.mp4"), for the common
// pattern of naming ordered clips 1.mp4, 2.mp4, 3.0.mp4, ...
func sortedNumberedVideos(dir string) ([]string, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, fmt.Errorf("reading %s: %w", dir, err)
	}

	var files []string
	for _, entry := range entries {
		name := entry.Name()
		if !entry.IsDir() && strings.HasSuffix(strings.ToLower(name), ".mp4") {
			files = append(files, name)
		}
	}

	slices.SortFunc(files, func(a, b string) int {
		numA, errA := strconv.ParseFloat(strings.TrimSuffix(strings.ToLower(a), ".mp4"), 64)
		numB, errB := strconv.ParseFloat(strings.TrimSuffix(strings.ToLower(b), ".mp4"), 64)
		if errA != nil || errB != nil {
			return strings.Compare(a, b)
		}
		switch {
		case numA < numB:
			return -1
		case numA > numB:
			return 1
		default:
			return 0
		}
	})

	for i, name := range files {
		files[i] = filepath.Join(dir, name)
	}
	return files, nil
}

func cmdConcat(args []string) {
	fs := flag.NewFlagSet("concat", flag.ExitOnError)
	inputs := fs.String("inputs", "", "comma-separated list of input video files, in output order")
	dir := fs.String("dir", "", "directory of numbered .mp4 clips to concatenate in numeric order (alternative to -inputs)")
	output := fs.String("output", "", "output video file (required)")
	fs.Parse(args)

	if *output == "" {
		fmt.Fprintln(os.Stderr, "concat: -output is required")
		fs.Usage()
		os.Exit(1)
	}

	var files []string
	switch {
	case *inputs != "" && *dir != "":
		fmt.Fprintln(os.Stderr, "concat: use only one of -inputs or -dir")
		os.Exit(1)
	case *inputs != "":
		files = splitCommaList(*inputs)
	case *dir != "":
		var err error
		files, err = sortedNumberedVideos(*dir)
		if err != nil {
			fmt.Fprintf(os.Stderr, "concat: %v\n", err)
			os.Exit(1)
		}
	default:
		fmt.Fprintln(os.Stderr, "concat: one of -inputs or -dir is required")
		os.Exit(1)
	}

	if err := concatVideosRobust(files, *output); err != nil {
		fmt.Fprintf(os.Stderr, "concat: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Wrote %s\n", *output)
}

func cmdOverlay(args []string) {
	fs := flag.NewFlagSet("overlay", flag.ExitOnError)
	background := fs.String("background", "", "background video (required)")
	slidesFlag := fs.String("slides", "", "comma-separated list of slide clips, in overlay order (required)")
	output := fs.String("output", "", "output video file (required)")
	fs.Parse(args)

	if *background == "" || *slidesFlag == "" || *output == "" {
		fmt.Fprintln(os.Stderr, "overlay: -background, -slides, and -output are all required")
		fs.Usage()
		os.Exit(1)
	}

	if err := overlayConcatOnVideoSanitized(*background, splitCommaList(*slidesFlag), *output); err != nil {
		fmt.Fprintf(os.Stderr, "overlay: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Wrote %s\n", *output)
}

func cmdSlideshow(args []string) {
	fs := flag.NewFlagSet("slideshow", flag.ExitOnError)
	audio := fs.String("audio", "", "audio track (required)")
	list := fs.String("list", "", "ffmpeg concat-format image/timing list file, e.g. exported from the marker UI (required)")
	output := fs.String("output", "", "output video file (required)")
	fs.Parse(args)

	if *audio == "" || *list == "" || *output == "" {
		fmt.Fprintln(os.Stderr, "slideshow: -audio, -list, and -output are all required")
		fs.Usage()
		os.Exit(1)
	}

	if err := createVideoAudioAndFrames(*audio, *list, *output); err != nil {
		fmt.Fprintf(os.Stderr, "slideshow: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Wrote %s\n", *output)
}

func cmdConcatAudio(args []string) {
	fs := flag.NewFlagSet("concat-audio", flag.ExitOnError)
	inputs := fs.String("inputs", "", "comma-separated list of input audio files, in output order (required)")
	output := fs.String("output", "", "output audio file (required)")
	fs.Parse(args)

	if *inputs == "" || *output == "" {
		fmt.Fprintln(os.Stderr, "concat-audio: -inputs and -output are required")
		fs.Usage()
		os.Exit(1)
	}

	if err := concatAudioFiles(splitCommaList(*inputs), *output); err != nil {
		fmt.Fprintf(os.Stderr, "concat-audio: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Wrote %s\n", *output)
}
