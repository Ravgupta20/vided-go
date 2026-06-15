import React from 'react';
import { useAudioMarkers } from './hooks/useAudioMarkers';
import { MarkerList } from './components/Markerlist';
import { useImager } from './hooks/Imager';

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

  const assignPoolImageToSelectedSlot = (imageUrl: string) => {
    if (selectedMarkerIndex === -1 || selectedMarkerIndex >= marker.length) {
      alert("Please click and select a marker box from the timeline track below first!");
      return;
    }
    
    const updated = [...marker];
    updated[selectedMarkerIndex].imageUrl = imageUrl;
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

  const currentlyPreviewedImage = selectedMarkerIndex !== -1 ? marker[selectedMarkerIndex]?.imageUrl : null;

  return (
    <div style={{ 
      padding: '24px', 
      fontFamily: 'sans-serif', 
      background: '#fc9797', 
      color: '#fff', 
      minHeight: '100vh', 
      width: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div>
        <button onClick={handleOpenDirectory} style={{ padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' }}>Open Image Directory</button>
        <h3 style={{ margin: '12px 0 4px 0' }}>Loaded Images ({images.length})</h3>
      </div>
      
      {/* 2-Column Main Layout Workspace Wrapper */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        width: '100%', 
        boxSizing: 'border-box',
        alignItems: 'stretch'
      }}>
        
        {/* LEFT COLUMN: Pure Image Asset Pool Panel */}
        <div style={{ 
          width: '180px', 
          minWidth: '180px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px', 
          height: '60vh', 
          minHeight: '400px',
          overflowY: 'auto', 
          background: '#2a2a2a', 
          padding: '12px', 
          borderRadius: '8px',
          border: '1px solid #444',
          boxSizing: 'border-box'
        }}>
          {images.length === 0 ? (
            <div style={{ color: '#777', fontSize: '12px', textAlign: 'center', marginTop: '40px', fontStyle: 'italic', lineHeight: '1.5' }}>
              No images<br/>loaded yet.
            </div>
          ) : (
            images.map((img, idx) => (
              <div 
                key={idx} 
                onClick={() => assignPoolImageToSelectedSlot(img.url)} 
                style={{ padding: '6px', cursor: 'pointer', background: '#1a1a1a', border: '1px solid #444', textAlign: 'center', borderRadius: '4px' }}
              >
                <img src={img.url} alt={img.name} style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '2px' }} />
                <p style={{ fontSize: '11px', color: '#ccc', margin: '6px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{img.name}</p>
              </div>
            ))
          )}
        </div>

        {/* WORKSPACE MAIN PREVIEW CANVAS */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: '#111', 
          borderRadius: '12px', 
          padding: '20px', 
          border: '1px solid #333', 
          height: '60vh',
          minHeight: '400px',
          boxSizing: 'border-box'
        }}>
          {currentlyPreviewedImage ? (
            <img src={currentlyPreviewedImage} alt="Active Slide View" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px' }} />
          ) : (
            <div style={{ textAlign: 'center', color: '#555' }}>
              <p style={{ fontSize: '48px', margin: '0 0 12px 0' }}>🖼️</p>
              <p style={{ fontSize: '14px', margin: 0, fontWeight: '500' }}>
                {selectedMarkerIndex !== -1 
                  ? "This marker slot is empty. Click an asset on the left to assign it." 
                  : "Select a timeline marker block below to preview or edit"}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* TIMELINE CONTROLS PANEL FOOTER */}
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