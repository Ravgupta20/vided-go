package main

import (
	"flag"
	"fmt"
	"os"
)

// recordScreen captures the desktop + a named microphone/audio device via
// ddagrab + NVENC. Native/local only — not something a container can do
// (needs direct desktop and audio-device access).
func recordScreen(audioDevice, output string) error {
	if err := ensureParentDir(output); err != nil {
		return err
	}
	return runFFmpeg(
		"-f", "ddagrab",
		"-framerate", "60",
		"-video_size", "2560x1440",
		"-i", "desktop",
		"-f", "dshow",
		"-queue_size", "1024",
		"-i", fmt.Sprintf("audio=%s", audioDevice),
		"-c:v", "h264_nvenc",
		"-preset", "p4",
		"-cq:v", "19",
		"-pix_fmt", "yuv420p",
		"-c:a", "aac",
		"-b:a", "192k",
		"-thread_queue_size", "512",
		"-vsync", "cfr",
		"-y",
		output,
	)
}

// recordScreenVirtual is the same idea but for a virtual audio cable
// (e.g. VB-Audio) instead of a physical microphone.
func recordScreenVirtual(audioDevice, output string) error {
	if err := ensureParentDir(output); err != nil {
		return err
	}
	return runFFmpeg(
		"-f", "ddagrab",
		"-framerate", "60",
		"-video_size", "2560x1440",
		"-offset_x", "0",
		"-offset_y", "0",
		"-i", "desktop",
		"-f", "dshow",
		"-i", fmt.Sprintf("audio=%s", audioDevice),
		"-c:v", "h264_nvenc",
		"-preset", "p4",
		"-cq:v", "19",
		"-b:v", "0",
		"-c:a", "aac",
		"-b:a", "192k",
		"-pix_fmt", "yuv420p",
		"-y",
		output,
	)
}

func cmdRecord(args []string) {
	fs := flag.NewFlagSet("record", flag.ExitOnError)
	audioDevice := fs.String("audio-device", "", `dshow audio device name, e.g. "Microphone (Yeti Stereo Microphone)" (required)`)
	output := fs.String("output", "", "output video file (required)")
	fs.Parse(args)

	if *audioDevice == "" || *output == "" {
		fmt.Fprintln(os.Stderr, "record: -audio-device and -output are required")
		fs.Usage()
		os.Exit(1)
	}

	if err := recordScreen(*audioDevice, *output); err != nil {
		fmt.Fprintf(os.Stderr, "record: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Wrote %s\n", *output)
}

func cmdRecordVirtual(args []string) {
	fs := flag.NewFlagSet("record-virtual", flag.ExitOnError)
	audioDevice := fs.String("audio-device", "", `dshow audio device name, e.g. "CABLE Output (VB-Audio Virtual Cable)" (required)`)
	output := fs.String("output", "", "output video file (required)")
	fs.Parse(args)

	if *audioDevice == "" || *output == "" {
		fmt.Fprintln(os.Stderr, "record-virtual: -audio-device and -output are required")
		fs.Usage()
		os.Exit(1)
	}

	if err := recordScreenVirtual(*audioDevice, *output); err != nil {
		fmt.Fprintf(os.Stderr, "record-virtual: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Wrote %s\n", *output)
}
