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
const addAndRecalculateMarkers = () => {
  if (!audioRef.current) return;

  const duration = audioRef.current.duration;

  // Safety check to ensure audio file metadata has loaded
  if (isNaN(duration) || duration === 0) {
    alert("Audio track is still loading or invalid.");
    return;
  }

  // 1. Calculate what the NEXT total size of the array will be
  const nextTotalCount = marker.length + 1;

  // 2. Re-slice the ENTIRE duration into 'nextTotalCount' intervals
  const newMarkers: string[] = [];
  
  // Option A: If you want them distributed as equal milestones across the track:
  const interval = duration / nextTotalCount;
  for (let i = 1; i <= nextTotalCount; i++) {
    const timeInSeconds = interval * i;
    newMarkers.push(formatTime(timeInSeconds));
  }

  // 3. Overwrite the state with the fully updated, recalculated array
  setMarker(newMarkers);
};

const convertTimestampToSeconds = (timestamp: string): number => {
  const parts = timestamp.split(':');
  
  if (parts.length === 3) {
    // Handles HH:MM:SS
    const hrs = parseInt(parts[0], 10);
    const mins = parseInt(parts[1], 10);
    const secs = parseInt(parts[2], 10);
    return (hrs * 3600) + (mins * 60) + secs;
  } else {
    // Handles MM:SS
    const mins = parseInt(parts[0], 10);
    const secs = parseInt(parts[1], 10);
    return (mins * 60) + secs;
  }
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
    addNewDynamicMarker,
    addAndRecalculateMarkers,
    convertTimestampToSeconds,
  };
};