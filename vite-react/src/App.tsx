import React, { useState, useRef } from 'react';

interface LocalImage {
  name: string;
  url: string;
  handle?: any;
}

export default function App() {
  const [images, setImages] = useState<LocalImage[]>([]);
  const [marker, setMarker] = useState<String[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [selectedImage, setSelectedImage] = useState<LocalImage | null>(null);
  const [rootDirectoryHandle, setRootDirectoryHandle] = useState<any>(null);

  const isImageFile = (fileName: string) =>
    /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(fileName);

  async function* getImageFilesRecursively(entry: any): AsyncGenerator<LocalImage> {
    if (entry.kind === 'file') {
      if (isImageFile(entry.name)) {
        const file = await entry.getFile();
        const url = URL.createObjectURL(file);
        yield { name: entry.name, url, handle: entry };
      }
    } else if (entry.kind === 'directory') {
      for await (const handle of entry.values()) {
        yield* getImageFilesRecursively(handle);
      }
    }
  }

  const handleOpenDirectory = async () => {
    try {
      images.forEach((img) => URL.revokeObjectURL(img.url));
      setSelectedImage(null);

      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      });
      setRootDirectoryHandle(dirHandle);

      const loaded: LocalImage[] = [];
      for await (const imgData of getImageFilesRecursively(dirHandle)) {
        loaded.push(imgData);
      }
      setImages(loaded);
      if (loaded.length > 0) setSelectedImage(loaded[0]);
    } catch (err) {
      console.log('Directory picker failed or was cancelled:', err);
    }
  };

  const handleDeleteImage = async (imageToDelete: LocalImage) => {
    if (!rootDirectoryHandle) return;
    const confirmDelete = window.confirm(`Delete "${imageToDelete.name}" from disk?`);
    if (!confirmDelete) return;
    try {
      await rootDirectoryHandle.removeEntry(imageToDelete.name);
      URL.revokeObjectURL(imageToDelete.url);
      const updated = images.filter((img) => img.url !== imageToDelete.url);
      setImages(updated);
      if (selectedImage?.url === imageToDelete.url) {
        setSelectedImage(updated.length > 0 ? updated[0] : null);
      }
      alert('Deleted.');
    } catch (err) {
      console.error('Failed to delete file:', err);
      alert('Could not delete file. Check permissions.');
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
        <p style={{ color: '#000000' }}>No directory selected or no images found.</p>
      ) : (
        <div style={{ display: 'flex', gap: 30, marginTop: 20 }}>
          <div style={{ width: 160, display: 'flex', flexDirection: 'column', gap: 15, maxHeight: '70vh', overflowY: 'auto' }}>
            {images.map((img, idx) => {
              const isCurrent = selectedImage?.url === img.url;
              return (
                <div key={idx} onClick={() => setSelectedImage(img)} style={{ border: isCurrent ? '2px solid #00ffff' : '1px solid #444', padding: 6, cursor: 'pointer', background: '#2a2a2a' }}>
                  <img src={img.url} alt={img.name} style={{ width: '100%', height: 80, objectFit: 'cover' }} />
                  <p style={{ fontSize: 11, color: isCurrent ? '#00ffff' : '#ccc', margin: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{img.name}</p>
                </div>
              );
            })}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#111', borderRadius: 12, padding: 20, border: '1px solid #333', minHeight: 400 }}>
            {selectedImage ? (
              <>
                <img src={selectedImage.url} alt={selectedImage.name} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 4 }} />
                <p style={{ marginTop: 15, color: '#aaa' }}>{selectedImage.name}</p>
                <button onClick={() => handleDeleteImage(selectedImage)} style={{ padding: '8px 16px', background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Delete Image From Computer</button>
              </>
            ) : (
              <p style={{ color: '#555' }}>Select an image from the left sidebar to preview</p>
            )}
          </div>
        </div>
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#111', borderRadius: 12, padding: 20, border: '1px solid #333', minHeight: 100 }}>
           <audio 
           ref={audioRef}
              controls
              src="\public\audio\audio_out.mp3"
              style={{ width: '100%', 
                        maxWidth: '500px', 
                        borderRadius: '8px',
                        outline: 'none', 
                        marginBottom: '12px' // Spacing between track and button
                        }}>
            Your browser does not support the audio element.
            </audio>
            {/* Auto-Marker Button */}
  <button
    onClick={addMidpointMarker}
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
    Capture Midpoint Marker
  </button>
  {/* Optional: Visual verification list of your captured markers */}
  {marker.length > 0 && (
    <div style={{ color: '#aaa', marginTop: '10px', fontSize: '12px' }}>
      Captured Markers: {marker.join(', ')}
    </div>
  )}
      </div>
    </div>
  );
}