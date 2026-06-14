import React, { useState } from 'react';
import { useAudioMarkers } from './hooks/useAudioMarkers';
import { MarkerList } from './components/Markerlist';
import { useImager } from './hooks/Imager';
import { ImageList } from './components/ImageList';


export default function App() {
  const [markerCount, setMarkerCount] = useState<number | "">("");
  const { handleOpenDirectory, images, selectedImage, setSelectedImage, handleDeleteImage } = useImager();
  // const audioRef = useRef<HTMLAudioElement | null>(null);
  // const [selectedImage, setSelectedImage] = useState<LocalImage | null>(null);
  

  const {marker,setMarker, audioRef, addAndRecalculateMarkers, convertTimestampToSeconds} =useAudioMarkers();

  const handleMarkerClick = (timestamp: string) => {
    if (audioRef.current) {
      const seconds = convertTimestampToSeconds(timestamp);

      //Jump to that time in the audio track
      audioRef.current.currentTime = seconds;

      //Automatically start playing the audio track
      audioRef.current.play().catch((err) => {
        console.error('Failed to play audio:', err);
        alert('Could not play audio. Check browser permissions or file validity.');
      });
    }
  };

  // Function to calculate midpoint and add it to markers
  const addMidpointMarker = () => {
    if (audioRef.current) {
      const duration = audioRef.current.duration;

      // Safety check in case audio hasn't loaded yet
      if (isNaN(duration) || duration === 0) {
        alert("Audio track is still loading or invalid.");
        return;
      }

      const midTimeInSeconds = duration / 2;

      // Format seconds into a standard HH:MM:SS or MM:SS timestamp string
      const formattedTimestamp = formatTime(midTimeInSeconds);

      // Append to your existing markers array
      setMarker((prevMarkers) => [...prevMarkers, formattedTimestamp]);
    }
  };
   // Function to generate markers evenly and add it to markers
  const generateEvenMarkers = () => {
  if (!audioRef.current) return;

  const duration = audioRef.current.duration;

  // 1. Safety check for the audio track
  if (isNaN(duration) || duration === 0) {
    alert("Audio track is still loading or invalid.");
    return;
  }

  // 2. Safety check for the user's input
  if (markerCount === "" || markerCount <= 0) {
    alert("Please enter how many markers you want first!");
    return;
  }

  const newMarkers: string[] = [];
  const interval = duration / (markerCount + 1);

  for (let i = 1; i <= markerCount; i++) {
    const timeInSeconds = interval * i;
    newMarkers.push(formatTime(timeInSeconds));
  }

  setMarker(newMarkers);
};
  // Helper utility to convert raw seconds into a clean timestamp string
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const pad = (num: number) => String(num).padStart(2, '0');

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

    return (
    <div style={{ padding: 20, fontFamily: 'sans-serif', background: '#fc9797', color: '#fff', minHeight: '100vh' }}>
      <button onClick={handleOpenDirectory} style={{ padding: '10px 20px' }}>Open Image Directory</button>
      <h3>Loaded Images ({images.length})</h3>

      {images.length === 0 ? (
        <p style={{ color: '#aaa' }}>No directory selected or no images found.</p>
      ) : (
        <ImageList 
          images={images}
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
          handleDeleteImage={handleDeleteImage}
        />
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#111', borderRadius: 12, padding: 20, border: '1px solid #333', minHeight: 100 }}>
           <audio 
           ref={audioRef}
              controls
              src="/public/audio/audio_out.mp3"
              style={{ width: '100%', 
                        maxWidth: '500px', 
                        borderRadius: '8px',
                        outline: 'none', 
                        marginBottom: '12px' // Spacing between track and button
                        }}>
            Your browser does not support the audio element.
            </audio>
            {/* 2. Controls Row containing the input and button */}
  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
    
    
            {/* Auto-Marker Button */}
  <button
    onClick={addAndRecalculateMarkers}
    style={{
      padding: '8px 16px',
      background: '#007acc',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '14px',
      transition: 'background 0.2s'
    }}
    onMouseOver={(e) => (e.currentTarget.style.background = '#0062a3')}
    onMouseOut={(e) => (e.currentTarget.style.background = '#007acc')}
  >
    Add Marker
  </button>
      </div>
 
    <MarkerList markers={marker} setMarkers={setMarker} onMarkerClick={handleMarkerClick} />
  </div>
    </div>
  );
}