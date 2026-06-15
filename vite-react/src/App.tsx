import React from 'react';
import { useAudioMarkers } from './hooks/useAudioMarkers';
import { MarkerList } from './components/Markerlist';
import { useImager } from './hooks/Imager';

export default function App() {
  const { handleOpenDirectory, images } = useImager();
  
  // Connect all our clean object track data from our hook
  const {
    marker,
    setMarker,
    audioRef,
    addAndRecalculateMarkers,
    convertTimestampToSeconds,
    selectedMarkerIndex,
    setSelectedMarkerIndex
  } = useAudioMarkers();

  // Triggered when clicking a pool image on the left asset panel
  const assignPoolImageToSelectedSlot = (imageUrl: string) => {
    if (selectedMarkerIndex === -1 || selectedMarkerIndex >= marker.length) {
      alert("Please click and select a marker box from the timeline track below first!");
      return;
    }
    
    // Update the image property of our active marker object slot
    const updated = [...marker];
    updated[selectedMarkerIndex].imageUrl = imageUrl;
    setMarker(updated);
  };

  const handleMarkerClick = (timestamp: string, index: number) => {
    setSelectedMarkerIndex(index); // Set our active focus slot
    
    if (audioRef.current) {
      const seconds = convertTimestampToSeconds(timestamp);
      audioRef.current.currentTime = seconds;
      audioRef.current.play().catch((err) => console.error('Audio play error:', err));
    }
  };

  // Pull the current preview image out based on our highlighted slot
  const currentlyPreviewedImage = selectedMarkerIndex !== -1 ? marker[selectedMarkerIndex]?.imageUrl : null;

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif', background: '#fc9797', color: '#fff', minHeight: '100vh' }}>
      <button onClick={handleOpenDirectory} style={{ padding: '10px 20px' }}>Open Image Directory</button>
      <h3>Loaded Images ({images.length})</h3>
      
      <div style={{ display: 'flex', gap: 30, marginTop: 20 }}>
        
        {/* SIDEBAR ASSET POOL: Completely independent storage pool */}
        <div style={{ width: 160, display: 'flex', flexDirection: 'column', gap: 15, maxHeight: '70vh', overflowY: 'auto', background: '#2a2a2a', padding: 10, borderRadius: 6 }}>
          {images.map((img, idx) => (
            <div 
              key={idx} 
              onClick={() => assignPoolImageToSelectedSlot(img.url)} 
              style={{ padding: 6, cursor: 'pointer', background: '#1a1a1a', border: '1px solid #444', textAlign: 'center' }}
            >
              <img src={img.url} alt={img.name} style={{ width: '100%', height: 80, objectFit: 'cover' }} />
              <p style={{ fontSize: 11, color: '#ccc', margin: '6px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{img.name}</p>
            </div>
          ))}
        </div>

        {/* WORKSPACE PREVIEW CANVAS */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#111', borderRadius: 12, padding: 20, border: '1px solid #333', minHeight: 400 }}>
          {currentlyPreviewedImage ? (
            <img src={currentlyPreviewedImage} alt="Active Slide View" style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 4 }} />
          ) : (
            <p style={{ color: '#555' }}>
              {selectedMarkerIndex !== -1 ? "This marker slot is empty. Select an asset from the pool on the left to assign it." : "Select a marker slot block below to preview or edit"}
            </p>
          )}
        </div>
      </div>
      
      {/* TIMELINE INTERFACE FOOTER */}
      <div style={{ flex: 1, marginTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#111', borderRadius: 12, padding: 20, border: '1px solid #333' }}>
        <audio 
          ref={audioRef}
          controls
          src="/public/audio/audio_out.mp3"
          style={{ width: '100%', maxWidth: '500px', borderRadius: '8px', outline: 'none', marginBottom: '12px' }}
        />
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
          <button
            onClick={addAndRecalculateMarkers}
            style={{ padding: '8px 16px', background: '#007acc', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
          >
            Add Marker
          </button>
        </div>
 
        <MarkerList markers={marker} onMarkerClick={handleMarkerClick} />
      </div>
    </div>
  );
}