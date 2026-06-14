import React, { useState } from 'react';

interface LocalImage {
  name: string;
  url: string;
}

export default function ImageGalleryViewer() {
  const [images, setImages] = useState<LocalImage[]>([]);
  // Track the image currently viewed in the middle
  const [selectedImage, setSelectedImage] = useState<LocalImage | null>(null);

  const isImageFile = (fileName: string) => {
    return /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(fileName);
  };

  async function* getImageFilesRecursively(entry: any): AsyncGenerator<LocalImage> {
    if (entry.kind === 'file') {
      if (isImageFile(entry.name)) {
        const file = await entry.getFile();
        const url = URL.createObjectURL(file);
        yield { name: entry.name, url };
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
      setSelectedImage(null); // Clear active preview on new directory load

      const dirHandle = await (window as any).showDirectoryPicker();
      const loadedImages: LocalImage[] = [];

      for await (const imgData of getImageFilesRecursively(dirHandle)) {
        loadedImages.push(imgData);
      }

      setImages(loadedImages);
      // Automatically select the first image if available
      if (loadedImages.length > 0) {
        setSelectedImage(loadedImages[0]);
      }
    } catch (err) {
      console.log('User cancelled or picker failed:', err);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'sans-serif', 
      background: '#1e1e1e', 
      color: '#fff', 
      minHeight: '100vh',
      boxSizing: 'border-box'
    }}>
      <button 
        onClick={handleOpenDirectory}
        style={{ 
          padding: '10px 20px', 
          fontSize: '14px', 
          cursor: 'pointer',
          background: '#333',
          color: '#fff',
          border: '1px solid #555',
          borderRadius: '4px'
        }}
      >
        Open Image Directory
      </button>

      <h3 style={{ margin: '20px 0 10px 0' }}>Loaded Images ({images.length})</h3>

      {images.length === 0 ? (
        <p style={{ color: '#aaa' }}>No directory selected or no images found.</p>
      ) : (
        /* Main Layout split into Sidebar and Central Area */
        <div style={{ display: 'flex', gap: '30px', marginTop: '20px' }}>
          
          {/* Left Sidebar: Thumbnail List */}
          <div style={{ 
            width: '160px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '15px',
            maxHeight: 'calc(100vh - 150px)',
            overflowY: 'auto',
            paddingRight: '10px'
          }}>
            {images.map((img, index) => {
              const isCurrent = selectedImage?.url === img.url;
              return (
                <div 
                  key={index} 
                  onClick={() => setSelectedImage(img)}
                  style={{
                    border: isCurrent ? '2px solid #00ffff' : '1px solid #444',
                    borderRadius: '6px',
                    padding: '6px',
                    textAlign: 'center',
                    background: '#2a2a2a',
                    cursor: 'pointer',
                    transform: isCurrent ? 'scale(1.02)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <img 
                    src={img.url} 
                    alt={img.name} 
                    style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px' }} 
                  />
                  <p style={{ 
                    fontSize: '11px', 
                    margin: '6px 0 0 0', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    color: isCurrent ? '#00ffff' : '#ccc'
                  }}>
                    {img.name}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Central Main Preview Area */}
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
            minHeight: '400px'
          }}>
            {selectedImage ? (
              <>
                <img 
                  src={selectedImage.url} 
                  alt={selectedImage.name} 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '70vh', 
                    objectFit: 'contain',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    borderRadius: '4px'
                  }} 
                />
                <p style={{ marginTop: '15px', color: '#aaa', fontSize: '14px' }}>
                  {selectedImage.name}
                </p>
              </>
            ) : (
              <p style={{ color: '#555' }}>Select an image from the left sidebar to preview</p>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
