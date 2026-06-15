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
    /* MAIN ROW: Spans full width but caps at a comfortable maximum desktop width to keep things sharp */
    <div style={{ 
      display: 'flex', 
      gap: '20px', 
      marginTop: '20px', 
      width: '100%', 
      maxWidth: '1200px', // Prevents the layout from stretching into a giant distorted bar
      margin: '20px auto 0 auto', // Centers the workspace beautifully on large screens
      boxSizing: 'border-box',
      alignItems: 'stretch'
    }}>
      
      {/* LEFT SIDEBAR: Fixed width image drawer */}
      <div style={{ 
        width: '180px', 
        minWidth: '180px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '15px', 
        height: '60vh', 
        minHeight: '450px', 
        overflowY: 'auto', 
        background: '#2a2a2a', 
        padding: '12px', 
        borderRadius: '8px',
        border: '1px solid #444',
        boxSizing: 'border-box'
      }}>
        {images.length === 0 ? (
          <p style={{ color: '#666', fontSize: '12px', textAlign: 'center', marginTop: '40px', fontStyle: 'italic', lineHeight: '1.5' }}>
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
                  padding: '6px', 
                  cursor: 'pointer', 
                  background: '#1a1a1a', 
                  textAlign: 'center', 
                  borderRadius: '6px' 
                }}
              >
                <img src={img.url} alt={img.name} style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                <p style={{ fontSize: '11px', color: isCurrent ? '#00ffff' : '#ccc', margin: '6px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {img.name}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* CENTRAL PREVIEW CANVAS: Uses flex: 1 to look stunning empty OR full */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#111', 
        borderRadius: '12px', 
        padding: '24px', 
        border: '1px solid #333', 
        height: '60vh',
        minHeight: '450px',
        boxSizing: 'border-box'
      }}>
        {selectedImage ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <img 
              src={selectedImage.url} 
              alt={selectedImage.name} 
              style={{ 
                maxWidth: '100%', 
                maxHeight: 'calc(100% - 70px)', // Leaves perfect breathing room for name and delete button
                objectFit: 'contain', 
                borderRadius: '6px' 
              }} 
            />
            <p style={{ marginTop: '12px', color: '#aaa', fontSize: '13px', fontStyle: 'italic' }}>{selectedImage.name}</p>
            <button 
              onClick={() => handleDeleteImage(selectedImage)} 
              style={{ 
                marginTop: '8px', 
                padding: '8px 16px', 
                background: '#ff4d4d', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                fontSize: '12px'
              }}
            >
              Delete Image From Computer
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#555' }}>
            <p style={{ fontSize: '44px', margin: '0 0 10px 0' }}>🖼️</p>
            <p style={{ fontSize: '14px', margin: 0, fontWeight: '500', tracking: '0.5px' }}>
              Select an image from the left sidebar to preview
            </p>
          </div>
        )}
      </div>
    </div>
  );
}