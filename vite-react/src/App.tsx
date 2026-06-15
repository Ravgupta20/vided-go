import React, { useEffect } from 'react';
import { useAudioMarkers } from './hooks/useAudioMarkers';
import { MarkerList } from './components/Markerlist';
import { useImager } from './hooks/Imager';
import { ImageList } from './components/ImageList';

export default function App() {
  const { handleOpenDirectory, images } = useImager();
  
  const {
    marker,
    setMarker,
    audioRef,
    addAndRecalculateMarkers,
    convertTimestampToSeconds,
    selectedMarkerIndex,
    setSelectedMarkerIndex
  } = useAudioMarkers();

  // Forces your root html page containers to break out of narrow default templates
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
    updated[selectedMarkerIndex].imageUrl = img.url;
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

  const activeSelectedMarkerImage = selectedMarkerIndex !== -1 && marker[selectedMarkerIndex]?.imageUrl
    ? { name: marker[selectedMarkerIndex].timestamp, url: marker[selectedMarkerIndex].imageUrl! }
    : null;

  const handleDeleteImagePlaceholder = () => {
    if (selectedMarkerIndex !== -1) {
      const updated = [...marker];
      updated[selectedMarkerIndex].imageUrl = null;
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
      width: '100vw', // Uses literal viewport width units to break out of parent limits
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
      
      {/* Renders the fixed-width ImageList component */}
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
          src="/public/audio/audio_out.mp3"
          style={{ width: '100%', maxWidth: '600px', borderRadius: '8px', outline: 'none', marginBottom: '16px' }}
        />
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
          <button
            onClick={addAndRecalculateMarkers}
            style={{ padding: '10px 24px', background: '#007acc', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
          >
            Add Marker
          </button>
        </div>
 
        <MarkerList markers={marker} onMarkerClick={handleMarkerClick} />
      </div>
    </div>
  );
}