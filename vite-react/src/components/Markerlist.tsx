// components/Markerlist.tsx
import { useState } from 'react';
import { useAudioMarkers, TimelineMarker } from '../hooks/useAudioMarkers';

interface MarkerListProps {
  markers: TimelineMarker[];
  onMarkerClick: (timestamp: string, index: number) => void;
}

export function MarkerList({ markers, onMarkerClick }: MarkerListProps) {
  const { 
    selectedMarkerIndex, 
    setSelectedMarkerIndex, 
    selectedMarkerTime, 
    setSelectedMarkerTime, 
    handleSaveMarker 
  } = useAudioMarkers();

  // Local state to keep track of inline edit mode toggle
  const [isInlineEditing, setIsInlineEditing] = useState<boolean>(false);

  return (
    <div style={{ width: '100%', maxWidth: '500px' }}>
      <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '12px', textAlign: 'center' }}>
        <strong>Interactive Video Timeline Track Layout:</strong>
      </p>
      
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {markers.map((item, index) => {
          const isActiveSlot = selectedMarkerIndex === index;
          const showInputField = isInlineEditing && isActiveSlot;

          return (
            <div 
              key={index} 
              onClick={() => {
                setIsInlineEditing(false); // Reset editing mode context on direct switch clicks
                onMarkerClick(item.timestamp, index);
              }}
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                background: '#1a1a1a', 
                border: isActiveSlot ? '2px solid #00ffff' : '1px solid #444', 
                borderRadius: '6px', 
                padding: '8px',
                cursor: 'pointer'
              }}
            >
              {/* THE CORRESPONDING IMAGE MINI BOX SLOT */}
              <div style={{ 
                width: '80px', 
                height: '55px', 
                background: '#000', 
                border: item.imageUrl ? 'none' : '1px dashed #555',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                marginBottom: '6px'
              }}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '9px', color: '#555' }}>Empty Box</span>
                )}
              </div>

              {/* CONTROLS */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {showInputField ? (
                  <input
                    type="text"
                    value={selectedMarkerTime}
                    onChange={(e) => setSelectedMarkerTime(e.target.value)}
                    onBlur={() => {
                      handleSaveMarker(index);
                      setIsInlineEditing(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveMarker(index);
                        setIsInlineEditing(false);
                      }
                      if (e.key === 'Escape') setIsInlineEditing(false);
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()} // Keeps input typing from jumping audio
                    style={{ width: '55px', background: '#333', border: '1px solid #007acc', color: '#fff', textAlign: 'center', fontSize: '11px', borderRadius: '2px' }}
                  />
                ) : (
                  <>
                    <button
                      style={{ background: 'none', border: 'none', color: '#34a853', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '11px', padding: 0, cursor: 'pointer' }}
                    >
                      {item.timestamp}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Block track seeking
                        setSelectedMarkerIndex(index);
                        setSelectedMarkerTime(item.timestamp);
                        setIsInlineEditing(true);
                      }}
                      style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', marginLeft: '4px', padding: 0, fontSize: '11px' }}
                    >
                      ✏️
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}