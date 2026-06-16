package main

import (
	"bytes"
	"fmt"
	"os/exec"
	"strconv"
	"strings"
	"time"
)

type InputVid struct {
	filename string
}

func (i *InputVid) Clean() {
	i.filename = strings.ReplaceAll(i.filename, " ", "")
}

type Timer struct {
	ID			int
	RawTime 	string
	Duration 	time.Duration
}



func main() {
	// 1. Initialize multiple timer objects matching your image data
	// Supported formats: MM:SS or H:MM:SS by appending 'm' and 's' suffixes
	// rawTimers := []string{
	// 	// "01:05", // Timer 1
	// 	// "2:45",  // Timer 2
	// 	"09:00", // Timer 3
	// 	// "29:20", // Timer 4
	// 	// "30:20", // Timer 5 (selected)
	// }
	// createRecording(`Microphone (Yeti Stereo Microphone)`, `testoutput.mp4`)
	// cutBulkSegments(rawTimers)

	// 1. Define your initial string
	// timerStr := "00:00:00"
	// // var outputFilename
	// // var outputAudio string
	// // var inputVid InputVid
	// // inputVid.filename = "vid_input.mov"
	// // inputVid.filename = "audio_vid_input.mov"
	// // getBestFrame(&inputVid, "test1.png")
	// // extractAudio(`C:\github\vided-go\recordings\july_release\release_july_release_hype.mp4`, `audio_out.mp3`).Run()
	// copyVid(`C:\github\vided-go\recordings\july_release\release_july_release_hype.mp4`, `palworld_ffmpeg_1.mp4`, "00:03:30", "00:05:20").Run()
	copyVid(`normies_dicovers_programming.mp4`, `casual_dicovers_programming.mp4`, "00:00:13", "").Run()
	// copyVid(`C:\github\vided-go\Palworld_FFMPEG_3.mp4`, `palworld_ffmpeg_2.mp4`, "", "00:00:52").Run()
	// copyVid(`C:\github\vided-go\FFMPEG_Bulk_Concat_Palworld_Images.mp4`, `Palworld_Release_Trailer_Funny_Screen_Shots.mp4`, "00:01:35", "").Run()
	// copyVid(`C:\github\vided-go\recordings\july_release\release_july_release_hype.mp4`, `palworld_ffmpeg_3.mp4`, "00:29:20", "00:31:20").Run()
	// copyVid(`C:\github\vided-go\recordings\july_release\release_july_release_hype.mp4`, `palworld_ffmpeg_4.mp4`, "00:30:20", "00:32:20").Run()
	// createVideoAudioAndFrames(`C:\github\vided-go\vite-react\public\audio\audio_out.mp3`, `recordings\slides\input_images_timeline.txt`, "test_audio_vid.mp4")
	// getFrameSlides(&inputVid, "slides/slides_%03d.png")
	// getSingleFrame(&inputVid, "00:00:01", "test.png")
	// inputVid.Clean()
	// outputFilename = "test_output.mp4"
	// outputAudio = "audio_out.mp3"
	// Equivalent to: ffmpeg -i input.mp4 -c:v libx264 -crf 23 output.mp4
	// cmd := copyVid(inputVid.filename, outputFilename, "00:00:05", "")
	// cmd := extractAudio(inputVid.filename, outputAudio)
	// time, err := getAudioDuration(outputAudio)
	// if err == nil {
	// 	fmt.Println("Failed to extract audio")
	// }
	// fmt.Println(time)
	// var stdout bytes.Buffer
	// var stderr bytes.Buffer

	// cmd.Stdout = &stdout // Captures the version info
	// cmd.Stderr = &stderr // Captures any errors

	// err = cmd.Run()
	// if err != nil {
	// 	fmt.Printf("FFmpeg failed: %v\nError details: %s\n", err, stderr.String())
	// 	return

	// }

	// Print the captured version text
	// fmt.Println(stdout.String())
	// 	"-c:v", "libx264",
	// 	"-crf", "23",
	// 	"output.mp4",
	// )

}

func cutBulkSegments(rawTimers []string) {
	
	var timers []Timer

	// 2. Loop through and create duration objects for each
	for i, raw := range rawTimers {
		// Go's time.ParseDuration expects format like "1m5s" or "2m45s"
		// We can quickly reformat "MM:SS" strings by replacing ":" with "m" and adding "s"
		var formatted string
		var min, sec int
		
		// Parse string numbers directly to avoid layout mismatches with missing leading zeros
		_, err := fmt.Sscanf(raw, "%d:%d", &min, &sec)
		if err != nil {
			fmt.Printf("Error parsing %s: %v\n", raw, err)
			continue
		}
		formatted = fmt.Sprintf("%dm%ds", min, sec)

		duration, err := time.ParseDuration(formatted)
		if err != nil {
			fmt.Println("Error parsing duration:", err)
			continue
		}

		timers = append(timers, Timer{
			ID:       i + 1,
			RawTime:  raw,
			Duration: duration,
		})
	}


	fmt.Println("--- Original Timers vs Updated (+2 Min) ---")

	// 3. Loop through your slice to add the default 2 minutes
	for i, t := range timers {
		// Add the default 2 minutes
		updatedDuration := t.Duration + (2 * time.Minute)

		// Convert back into an MM:SS display format
		minutes := int(updatedDuration.Minutes())
		seconds := int(updatedDuration.Seconds()) % 60
		displayTime := fmt.Sprintf("%02d:%02d", minutes, seconds)

		// fmt.Printf("Timer %d | Original: %s | Updated: %s\n", t.ID, t.RawTime, displayTime)
		copyVid(`C:\github\vided-go\recordings\july_release\release_july_release_hype.mp4`, fmt.Sprintf(`test_%d.mp4`, i), t.RawTime, displayTime).Run()
	}
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

	args = append(args, "-i", inputName, "-c", "copy", "-y", outputName)

	return exec.Command("ffmpeg", args...)
}

// Extract a Specific Moment (Best for Precision):
// If you know exactly what second in your video contains a great shot
// (for example, at 1 minute and 15 seconds), you can jump directly to that timestamp.
// -ffmpeg -ss 00:01:15 -i output.mp4 -vframes 1 thumbnail.png

func getSingleFrame(input *InputVid, timestamp string, outputName string) {

	args := []string{
		"-ss", timestamp,
		"-i", input.filename,
		"-vframes", "1", "-y", outputName,
	}

	cmd := exec.Command("ffmpeg", args...)

	// Capture both standard output and potential error output
	// var outBuffer bytes.Buffer
	var errBuffer bytes.Buffer
	// cmd.Stdout = &outBuffer
	cmd.Stderr = &errBuffer

	// Execute the command
	err := cmd.Run()
	if err != nil {
		fmt.Errorf("ffmpeg failed: %v (stderr: %s)", err, errBuffer.String())
	}

	// Clean up whitespace/newlines from the terminal output
	// cleanOutput := strings.TrimSpace(outBuffer.String())

	// Parse the string into a floating-point number
	// duration, err := strconv.ParseFloat(cleanOutput, 64)
	// if err != nil {
	// 	return 0, fmt.Errorf("failed to parse duration '%s': %v", cleanOutput, err)
	// }

	// return duration, nil
}

// Auto-Grab the Very Best Frame (Best for No-Effort)
// If you do not want to hunt for a timestamp, you can use a video filter to scan the video
// and automatically output the frame that has the highest amount of motion and visual detail.
// -ffmpeg -i input.mp4 -vf "thumbnail" -vframes 1 automatic_thumbnail.png
func getBestFrame(input *InputVid, outputName string) {

	args := []string{
		"-i", input.filename,
		"-vf", "thumbnail",
		"-vframes", "1", "-y", outputName,
	}

	cmd := exec.Command("ffmpeg", args...)

	// Capture both standard output and potential error output
	// var outBuffer bytes.Buffer
	var errBuffer bytes.Buffer
	// cmd.Stdout = &outBuffer
	cmd.Stderr = &errBuffer

	// Execute the command
	err := cmd.Run()
	if err != nil {
		fmt.Errorf("ffmpeg failed: %v (stderr: %s)", err, errBuffer.String())
	}

	// Clean up whitespace/newlines from the terminal output
	// cleanOutput := strings.TrimSpace(outBuffer.String())

	// Parse the string into a floating-point number
	// duration, err := strconv.ParseFloat(cleanOutput, 64)
	// if err != nil {
	// 	return 0, fmt.Errorf("failed to parse duration '%s': %v", cleanOutput, err)
	// }

	// return duration, nil
}

// Scenario C: Create a Grid of Multiple Frames (Best for Options)
// If you want to view a few different moments at once to choose the perfect shot,
// you can export one frame every 30 seconds into a numbered sequence.
// -ffmpeg -i input.mp4 -vf "fps=1/30" slides_%03d.png
func getFrameSlides(input *InputVid, outputName string) {
	// Group the -vf flag and its complete filter rule together
	args := []string{
		"-i", input.filename,
		"-vf", "fps=1/5",
		"-y",
		outputName, // Use the variable passed into the function!
	}

	cmd := exec.Command("ffmpeg", args...)

	// Capture both standard output and potential error output
	// var outBuffer bytes.Buffer
	var errBuffer bytes.Buffer
	// cmd.Stdout = &outBuffer
	cmd.Stderr = &errBuffer

	// Execute the command
	// Execute the command
	err := cmd.Run()
	if err != nil {
		// FIX: Use Printf so you can actually read the error in your terminal
		fmt.Printf("ffmpeg failed: %v (stderr: %s)\n", err, errBuffer.String())
		return
	}

}

//ffmpeg -f concat -safe 0 -i input_images_timeline.txt -i audio_out.mp3 -pix_fmt yuv420p -c:v libx264 -c:a copy -shortest output.mp4
func createVideoAudioAndFrames(inputAudio string, textFile string, outputName string){
	// Group the -vf flag and its complete filter rule together
	args := []string{
		"-f", "concat",
		"-safe", "0",
		"-i", textFile,
		"-i", inputAudio,
		"-pix_fmt", "yuv420p",
		"-c:v", "libx264", "-c:a",
		"copy", "-shortest",
		"-y",
		outputName, // Use the variable passed into the function!
	}

	cmd := exec.Command("ffmpeg", args...)

	// Capture both standard output and potential error output
	// var outBuffer bytes.Buffer
	var errBuffer bytes.Buffer
	// cmd.Stdout = &outBuffer
	cmd.Stderr = &errBuffer

	// Execute the command
	// Execute the command
	err := cmd.Run()
	if err != nil {
		// FIX: Use Printf so you can actually read the error in your terminal
		fmt.Printf("ffmpeg failed: %v (stderr: %s)\n", err, errBuffer.String())
		return
	}

}
// ffmpeg -f gdigrab -framerate 60 -video_size 2560x1440 -offset_x 0 -offset_y 0 -i desktop -f dshow -i audio="Microphone (Yeti Stereo Microphone)" -c:v h264_nvenc -preset p4 -cq:v 19 -c:a aac -pix_fmt yuv420p output.mp4
func createRecording(audioInput string, outputName string) {
	args := []string{
		"-f", "gdigrab",
		"-framerate", "60",
		"-video_size", "2560x1440",
		"-offset_x", "0",
		"-offset_y", "0",
		"-i", "desktop",
		"-f", "dshow",	
		"-i", fmt.Sprintf("audio=%s", audioInput),
		"-c:v", "h264_nvenc",
		"-preset", "p4",		
		"-cq:v", "19",
		"-c:a", "aac",
		"-pix_fmt", "yuv420p",
		"-y",
		outputName,
	}
	cmd := exec.Command("ffmpeg", args...)

	// Capture both standard output and potential error output
	// var outBuffer bytes.Buffer
	var errBuffer bytes.Buffer
	// cmd.Stdout = &outBuffer
	cmd.Stderr = &errBuffer
	// Execute the command
	err := cmd.Run()
	if err != nil {
		// FIX: Use Printf so you can actually read the error in your terminal
		fmt.Printf("ffmpeg failed: %v (stderr: %s)\n", err, errBuffer.String())
		return
	}

}
