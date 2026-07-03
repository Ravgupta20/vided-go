import React, { useEffect } from 'react';
import { useAudioMarkers } from '../hooks/useAudioMarkers';
import { MarkerList } from './Markerlist';
import { useImager } from '../hooks/Imager';
import { ImageList } from './ImageList';

export default function AudioMarker() { 

const { handleOpenDirectory, images } = useImager();
  
  const {
    marker,
    setMarker,
    handleSaveMarker,
    selectedMarkerTime,
    audioRef,
    setSelectedMarkerTime,
    addAndRecalculateMarkers,
    convertTimestampToSeconds,
    selectedMarkerIndex,
    setSelectedMarkerIndex
  } = useAudioMarkers();

  useEffect(() => {
    const rootContainer = document.getElementById('root');
    if (rootContainer) {
      rootContainer.style.width = '100%';
      rootContainer.style.maxWidth = '100%';
      rootContainer.style.margin = '0';
      rootContainer.style.padding = '0';
    }
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.width = '100%';
  }, []);

  const handleSelectImageForMarker = (img: any) => {
    if (selectedMarkerIndex === -1 || selectedMarkerIndex >= marker.length) {
      alert("Please click and select a marker box from the timeline track below first!");
      return;
    }
    const updated = [...marker];
    // Store both url and name to easily extract the file name for export
    updated[selectedMarkerIndex].imageUrl = img.url;
    updated[selectedMarkerIndex].imageName = img.name; 
    setMarker(updated);
  };

  const handleMarkerClick = (timestamp: string, index: number) => {
    setSelectedMarkerIndex(index);
    
    if (audioRef.current) {
      const seconds = convertTimestampToSeconds(timestamp);
      audioRef.current.currentTime = seconds;
      audioRef.current.play().catch((err) => console.error('Audio play error:', err));
    }
  };

 // EXPORT TIMELINE FUNCTION
  const exportTimelineToTxt = () => {
    if (marker.length === 0) {
      alert("Timeline is empty! Add marker slots and assign images before exporting.");
      return;
    }

    let txtContent = "";

    for (let i = 0; i < marker.length; i++) {
      const currentSlot = marker[i];
      
      // 1. Get the actual assigned image filename, or grab the first image loaded in your pool as a real fallback
      let fileName = (currentSlot as any).imageName || currentSlot.imageUrl;
      
      // Clean up the string path if it's a full URL path, extracting just "rel_xxx.png"
      if (fileName && fileName.includes('/')) {
        fileName = fileName.substring(fileName.lastIndexOf('/') + 1);
      }
      
      // If it's still empty because absolutely no image is connected, use your first loaded image asset name
      if (!fileName && images.length > 0) {
        fileName = images[0].name;
      } else if (!fileName) {
        fileName = "no_image_assigned.png";
      }
      
      // Automatically maps to a folder path like: file 'images/rel_014.png'
      txtContent += `file 'images/${fileName}'\n`;

      // 2. Calculate the duration difference for the gap between markers
      if (i < marker.length - 1) {
        const nextSlot = marker[i + 1];
        
        const currentSeconds = convertTimestampToSeconds(currentSlot.timestamp);
        const nextSeconds = convertTimestampToSeconds(nextSlot.timestamp);
        
        const calculatedDuration = nextSeconds - currentSeconds;
        const secureDuration = calculatedDuration > 0 ? calculatedDuration : 1;

        txtContent += `duration ${secureDuration.toFixed(2)}\n`;
      }
    }

    // 3. Download the generated script string
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.setAttribute('download', 'input_images_timeline.txt');
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const activeSelectedMarkerImage = selectedMarkerIndex !== -1 && marker[selectedMarkerIndex]?.imageUrl
    ? { name: (marker[selectedMarkerIndex] as any).imageName || marker[selectedMarkerIndex].timestamp, url: marker[selectedMarkerIndex].imageUrl! }
    : null;

  const handleDeleteImagePlaceholder = () => {
    if (selectedMarkerIndex !== -1) {
      const updated = [...marker];
      updated[selectedMarkerIndex].imageUrl = null;
      (updated[selectedMarkerIndex] as any).imageName = null;
      setMarker(updated);
    }
  };

  return (
    <div style={{ 
      padding: '24px', 
      fontFamily: 'sans-serif', 
      background: '#fc9797', 
      color: '#fff', 
      minHeight: '100vh', 
      width: '100vw',
      maxWidth: '100%',
      minWidth: '100vw',
      overflowX: 'hidden',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div>
        <button onClick={handleOpenDirectory} style={{ padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' }}>
          Open Image Directory
        </button>
        <h3 style={{ margin: '12px 0 4px 0' }}>Loaded Images ({images.length})</h3>
      </div>
      
      <ImageList 
        images={images}
        selectedImage={activeSelectedMarkerImage}
        setSelectedImage={handleSelectImageForMarker}
        handleDeleteImage={handleDeleteImagePlaceholder}
      />
      
      {/* TIMELINE TRACK CONTROLS FOOTER */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#111', 
        borderRadius: '12px', 
        padding: '24px', 
        border: '1px solid #333', 
        width: '100%', 
        boxSizing: 'border-box',
        marginTop: '8px'
      }}>
        <audio 
          ref={audioRef}
          controls
          src="/public/audio/july_release.mp3"
          style={{ width: '100%', maxWidth: '600px', borderRadius: '8px', outline: 'none', marginBottom: '16px' }}
        />
        
        {/* BUTTON BAR CONTAINER */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
          <button
            onClick={addAndRecalculateMarkers}
            style={{ padding: '10px 24px', background: '#007acc', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
          >
            Add Marker
          </button>

          {/* NEW GREEN EXPORT BUTTON */}
          <button
            onClick={exportTimelineToTxt}
            style={{ padding: '10px 24px', background: '#2ea44f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
          >
            Export Timeline (.txt)
          </button>
        </div>
 
        <MarkerList 
          markers={marker} 
          onMarkerClick={handleMarkerClick} 
          handleSaveMarker={handleSaveMarker}
          selectedMarkerTime={selectedMarkerTime}
          setSelectedMarkerTime={setSelectedMarkerTime}
          selectedMarkerIndex={selectedMarkerIndex}
          setSelectedMarkerIndex={setSelectedMarkerIndex}
          />
      </div>
    </div>
  );
}