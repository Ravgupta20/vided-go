import { useState, useRef } from 'react';

// 1. Define what a Timeline Marker object actually looks like
export interface TimelineMarker {
  timestamp: string;
  imageUrl: string | null; // Starts empty, can hold an image from your pool
}

// Standard time formatting helper (MM:SS)
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const useAudioMarkers = () => {
  const [marker, setMarker] = useState<TimelineMarker[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Tracks which marker is currently highlighted/focused in the timeline (-1 means none)
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number>(-1);
  // Stores the temporary text while editing the timestamp
  const [selectedMarkerTime, setSelectedMarkerTime] = useState<string>("");

  // Feature A: The original midpoint logic
  const addMidpointMarker = () => {
    if (!audioRef.current) return;
    const duration = audioRef.current.duration;
    if (isNaN(duration) || duration === 0) return;

    const formattedTimestamp = formatTime(duration / 2);
    setMarker((prev) => [...prev, { timestamp: formattedTimestamp, imageUrl: null }]);
  };

  // Cleaned-up Recalculator: Generates an empty slot for a pic with every new entry
  const addAndRecalculateMarkers = () => {
    if (!audioRef.current) return;

    const duration = audioRef.current.duration;
    if (isNaN(duration) || duration === 0) {
      alert("Audio track is still loading or invalid.");
      return;
    }

    const nextTotalCount = marker.length + 1;
    const interval = duration / nextTotalCount;
    const newMarkers: TimelineMarker[] = [];
    
    for (let i = 1; i <= nextTotalCount; i++) {
      const timeInSeconds = interval * i;
      
      // CRITICAL: Preserve any image the user ALREADY assigned to this slot position!
      const existingImage = marker[i - 1]?.imageUrl || null;

      newMarkers.push({
        timestamp: formatTime(timeInSeconds),
        imageUrl: existingImage
      });
    }

    setMarker(newMarkers);
    
    // Automatically focus the brand new slot we just created
    setSelectedMarkerIndex(nextTotalCount - 1);
  };

  // Feature B: The user-defined count spacing logic
  const generateEvenMarkersByCount = (count: number) => {
    if (!audioRef.current || count <= 0) return;
    const duration = audioRef.current.duration;
    if (isNaN(duration) || duration === 0) return;

    const newMarkers: TimelineMarker[] = [];
    const interval = duration / (count + 1);

    for (let i = 1; i <= count; i++) {
      newMarkers.push({ timestamp: formatTime(interval * i), imageUrl: null });
    }
    setMarker(newMarkers);
  };

  // Feature C: The automated array-length spacing logic
  const distributeExistingMarkersEvenly = () => {
    if (!audioRef.current || marker.length === 0) return;
    const duration = audioRef.current.duration;
    if (isNaN(duration) || duration === 0) return;

    const newMarkers: TimelineMarker[] = [];
    const interval = duration / (marker.length + 1);

    for (let i = 1; i <= marker.length; i++) {
      newMarkers.push({ timestamp: formatTime(interval * i), imageUrl: null });
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
    const currentCount = marker.length;
    const divisor = currentCount + 1; 

    // Calculate the specific timestamp position
    const targetTimeInSeconds = duration / divisor;
    const formattedTimestamp = formatTime(targetTimeInSeconds);

    // Append ONLY this new marker to your state array
    setMarker((prevMarkers) => [...prevMarkers, { timestamp: formattedTimestamp, imageUrl: null }]);
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

  const handleSaveMarker = (index: number) => {
    const timeRegex = /^([0-9]{1,2}:)?[0-9]{1,2}:[0-9]{2}$/;

    if (!timeRegex.test(selectedMarkerTime)) {
      alert("Invalid format! Please use MM:SS or HH:MM:SS.");
      return;
    }

    const updatedMarkers = [...marker];
    // Update just the timestamp sub-property of the object
    updatedMarkers[index].timestamp = selectedMarkerTime;
    setMarker(updatedMarkers);
  };

  // Everything returns neatly in one wrapper
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
    selectedMarkerIndex,
    setSelectedMarkerIndex,
    selectedMarkerTime,
    setSelectedMarkerTime,
    handleSaveMarker,
  };
};