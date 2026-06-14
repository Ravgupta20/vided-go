import { useState, useRef } from 'react';

// Standard time formatting helper (MM:SS)
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const useAudioMarkers = () => {
  const [marker, setMarker] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Feature A: The original midpoint logic
  const addMidpointMarker = () => {
    if (!audioRef.current) return;
    const duration = audioRef.current.duration;
    if (isNaN(duration) || duration === 0) return;

    const formattedTimestamp = formatTime(duration / 2);
    setMarker((prev) => [...prev, formattedTimestamp]);
  };

  // Feature B: The user-defined count spacing logic
  const generateEvenMarkersByCount = (count: number) => {
    if (!audioRef.current || count <= 0) return;
    const duration = audioRef.current.duration;
    if (isNaN(duration) || duration === 0) return;

    const newMarkers: string[] = [];
    const interval = duration / (count + 1);

    for (let i = 1; i <= count; i++) {
      newMarkers.push(formatTime(interval * i));
    }
    setMarker(newMarkers);
  };

  // Feature C: The automated array-length spacing logic
  const distributeExistingMarkersEvenly = () => {
    if (!audioRef.current || marker.length === 0) return;
    const duration = audioRef.current.duration;
    if (isNaN(duration) || duration === 0) return;

    const newMarkers: string[] = [];
    const interval = duration / (marker.length + 1);

    for (let i = 1; i <= marker.length; i++) {
      newMarkers.push(formatTime(interval * i));
    }
    setMarker(newMarkers);
  };
const addNewDynamicMarker = () => {
  if (!audioRef.current) return;

  const duration = audioRef.current.duration;

  // Safety check to ensure audio file metadata has loaded
  if (isNaN(duration) || duration === 0) {
    alert("Audio track is still loading or invalid.");
    return;
  }

  // Determine the divisor based on the existing array count
  // If array is empty (0), we divide by 1 to get the end of the track.
  const currentCount = marker.length;
  const divisor = currentCount + 1; 

  // Calculate the specific timestamp position
  const targetTimeInSeconds = duration / divisor;
  const formattedTimestamp = formatTime(targetTimeInSeconds);

  // Append ONLY this new marker to your state array
  setMarker((prevMarkers) => [...prevMarkers, formattedTimestamp]);
};

// Standard time formatting helper (MM:SS)
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};
  return {
    marker,
    setMarker,
    audioRef,
    addMidpointMarker,
    generateEvenMarkersByCount,
    distributeExistingMarkersEvenly,
    addNewDynamicMarker
  };
};