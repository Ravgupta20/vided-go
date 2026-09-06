package main

import (
	"fmt"
	"os"
)

func main() {
	if len(os.Args) < 2 {
		printTopLevelUsage()
		os.Exit(1)
	}

	switch os.Args[1] {
	case "concat":
		cmdConcat(os.Args[2:])
	case "overlay":
		cmdOverlay(os.Args[2:])
	case "slideshow":
		cmdSlideshow(os.Args[2:])
	case "cut":
		cmdCut(os.Args[2:])
	case "bulk-cut":
		cmdBulkCut(os.Args[2:])
	case "extract-audio":
		cmdExtractAudio(os.Args[2:])
	case "concat-audio":
		cmdConcatAudio(os.Args[2:])
	case "frame":
		cmdFrame(os.Args[2:])
	case "record":
		cmdRecord(os.Args[2:])
	case "record-virtual":
		cmdRecordVirtual(os.Args[2:])
	case "crop":
		cmdCrop(os.Args[2:])
	case "probe":
		cmdProbe(os.Args[2:])
	case "-h", "--help", "help":
		printTopLevelUsage()
	default:
		fmt.Fprintf(os.Stderr, "unknown command: %s\n\n", os.Args[1])
		printTopLevelUsage()
		os.Exit(1)
	}
}

func printTopLevelUsage() {
	fmt.Fprintln(os.Stderr, `vided-go — ffmpeg-based video editing helper

Usage: vided-go <command> [flags]

Commands:
  concat          Concatenate whole videos (sanitized: scale/pad/fps/audio normalized)
  overlay         Overlay a sequence of slide clips over a background video
  slideshow       Build a video from an image/timing concat-list + one audio track
  cut             Trim one video by stream-copy (-ss/-to, no re-encode)
  bulk-cut        Apply the same [start, end+pad] cut across a list of timestamps
  extract-audio   Pull the audio track out of a video
  concat-audio    Concatenate multiple audio files
  frame           Extract a frame: 'frame single|best|slides'
  record          Screen + microphone capture (native only, not for containers)
  record-virtual  Screen + virtual-cable audio capture (native only)
  crop            Crop an image: 'crop exact|center|edges'
  probe           Print a media file's duration in seconds

Run 'vided-go <command> -h' for a command's flags.`)
}
