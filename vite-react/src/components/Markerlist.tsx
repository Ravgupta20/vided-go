// MarkerList.tsx
import { useState } from 'react';

// 1. We define a TypeScript interface showing exactly what "Props" this component expects
interface MarkerListProps {
  markers: string[];
  setMarkers: React.Dispatch<React.SetStateAction<string[]>>;
  onMarkerClick: (timestamp: string) => void;
}

export function MarkerList({ markers, setMarkers, onMarkerClick }: MarkerListProps) {
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [editValue, setEditValue] = useState<string>("");

  const handleSaveMarker = (index: number) => {
    const timeRegex = /^([0-9]{1,2}:)?[0-9]{1,2}:[0-9]{2}$/;
    if (!timeRegex.test(editValue)) {
      alert("Invalid format! Use MM:SS or HH:MM:SS.");
      setEditingIndex(-1);
      return;
    }

    const updatedMarkers = [...markers];
    updatedMarkers[index] = editValue;
    setMarkers(updatedMarkers);
    setEditingIndex(-1);
  };

  return (
    <div style={{ width: '100%', maxWidth: '500px' }}>
      <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '8px', textAlign: 'center' }}>
        <strong>Markers Track Layout:</strong>
      </p>
      
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {markers.map((timeString, index) => {
          const isEditing = editingIndex === index;

          return (
            <div key={index} style={{ display: 'flex', alignItems: 'center', background: '#222', border: '1px solid #444', borderRadius: '4px', padding: '2px 6px' }}>
              {isEditing ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleSaveMarker(index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveMarker(index);
                    if (e.key === 'Escape') setEditingIndex(-1);
                  }}
                  autoFocus
                  style={{ width: '65px', background: '#333', border: '1px solid #007acc', color: '#fff', textAlign: 'center', borderRadius: '2px' }}
                />
              ) : (
                <>
                  <button
                    onClick={() => onMarkerClick(timeString)}
                    style={{ background: 'none', border: 'none', color: '#34a853', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' }}
                  >
                    {timeString}
                  </button>
                  <button
                    onClick={() => {
                      setEditingIndex(index);
                      setEditValue(timeString);
                    }}
                    style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', marginLeft: '4px' }}
                  >
                    ✏️
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}