interface LocalImage {
  name: string;
  url: string;
  handle?: any;
}

interface ImageListProps {
  images: LocalImage[];
  selectedImage: LocalImage | null;
  setSelectedImage: (img: LocalImage) => void;
  handleDeleteImage: (img: LocalImage) => void;
}

export function ImageList({ images, selectedImage, setSelectedImage, handleDeleteImage }: ImageListProps) {
  return (
    /* The main wrapper now spans the full screen width and won't collapse when empty */
    <div style={{ 
      display: 'flex', 
      gap: 30, 
      marginTop: 20, 
      width: '100%', 
      boxSizing: 'border-box',
      alignItems: 'stretch'
    }}>
      
      {/* LEFT SIDEBAR: Holds all loaded images (always stays fixed at 160px width) */}
      <div style={{ 
        width: 160, 
        minWidth: 160,
        display: 'flex', 
        flexDirection: 'column', 
        gap: 15, 
        height: '70vh', 
        minHeight: 400,
        overflowY: 'auto',
        background: '#1a1a1a', // Dark container backing
        padding: 10,
        borderRadius: 6,
        border: '1px solid #444',
        boxSizing: 'border-box'
      }}>
        {images.length === 0 ? (
          <p style={{ color: '#666', fontSize: 11, textAlign: 'center', marginTop: 20, fontStyle: 'italic', lineHeight: '1.4' }}>
            No images<br/>loaded yet.
          </p>
        ) : (
          images.map((img, idx) => {
            const isCurrent = selectedImage?.url === img.url;
            return (
              <div 
                key={idx} 
                onClick={() => setSelectedImage(img)} 
                style={{ 
                  border: isCurrent ? '2px solid #00ffff' : '1px solid #444', 
                  padding: 6, 
                  cursor: 'pointer', 
                  background: '#2a2a2a',
                  borderRadius: 4
                }}
              >
                <img src={img.url} alt={img.name} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 2 }} />
                <p style={{ fontSize: 11, color: isCurrent ? '#00ffff' : '#ccc', margin: '6px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {img.name}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* CENTRAL WORKSPACE PREVIEW CANVAS (Grows automatically to fill up the whole page) */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#111', 
        borderRadius: 12, 
        padding: 20, 
        border: '1px solid #333', 
        height: '70vh',
        minHeight: 400,
        boxSizing: 'border-box'
      }}>
        {selectedImage ? (
          <>
            <img src={selectedImage.url} alt={selectedImage.name} style={{ maxWidth: '100%', maxHeight: 'calc(100% - 60px)', objectFit: 'contain', borderRadius: 4 }} />
            <p style={{ marginTop: 15, color: '#aaa', fontSize: 13 }}>{selectedImage.name}</p>
            <button onClick={() => handleDeleteImage(selectedImage)} style={{ padding: '8px 16px', background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
              Delete Image From Computer
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: '#555' }}>
            <p style={{ fontSize: 40, margin: 0 }}>🖼️</p>
            <p style={{ fontSize: 14, margin: '10px 0 0 0' }}>Select an image from the left sidebar to preview</p>
          </div>
        )}
      </div>
    </div>
  );
}