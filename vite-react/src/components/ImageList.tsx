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
    );


}