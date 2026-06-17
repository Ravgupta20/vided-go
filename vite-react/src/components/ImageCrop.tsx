import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop, centerCrop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// ==========================================
// CONFIG: Change your preferred folder hint here!
// ==========================================
const DEFAULT_FOLDER_NAME = 'slides';

export default function ImageCropper() {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [originalFileName, setOriginalFileName] = useState<string>('cropped-image.jpg');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Save the original filename to state!
      setOriginalFileName(file.name);

      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop({ unit: '%', width: 80, height: 80 }, width, height);
    setCrop(initialCrop);
  };

  const getCanvasBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> => {
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95));
  };

  const saveCroppedImg = async () => {
    if (!imgRef.current || !completedCrop) return;

    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    try {
      const blob = await getCanvasBlob(canvas);
      if (!blob) return;

      let currentDirHandle = directoryHandle;

      if (!currentDirHandle) {
        if ('showDirectoryPicker' in window) {
          currentDirHandle = await (window as any).showDirectoryPicker({
            id: DEFAULT_FOLDER_NAME,
            startIn: 'downloads'
          });
          setDirectoryHandle(currentDirHandle);
        } else {
          // Fallback if File System API isn't supported
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = originalFileName; // Uses the original filename here too!
          a.click();
          URL.revokeObjectURL(url);
          alert('✨ Saved! (Fallback download mechanism used)');
          return;
        }
      }

      // Uses the exact filename grabbed during the file upload selection
      const fileHandle = await currentDirHandle!.getFileHandle(originalFileName, { create: true });
      
      const writable = await (fileHandle as any).createWritable();
      await writable.write(blob);
      await writable.close();

      alert(`💕 Successfully saved to your folder as "${originalFileName}"!`);
    } catch (err) {
      console.error('Error saving file:', err);
      alert('Oh no! Failed to save. Make sure directory permissions are active.');
    }
  };

  return (
    <div style={{ 
      padding: '30px', 
      width: 'fit-content', 
      maxWidth: '90%', 
      minWidth: '320px', 
      margin: '20px auto',
      backgroundColor: '#FFF5F5', 
      borderRadius: '24px', 
      boxShadow: '0 8px 24px rgba(255, 182, 193, 0.4)', 
      fontFamily: '"Quicksand", "Nunito", system-ui, sans-serif', 
      textAlign: 'center',
      border: '3px dashed #FFB6C1', 
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#FF6B8B', fontSize: '1.4rem' }}>
        ✨ Image Snipper ✨
      </h3>
      <p style={{ margin: '0 0 20px 0', color: '#A08488', fontSize: '0.9rem' }}>
        Saving to directory template: <code style={{ background: '#FFE3E8', padding: '2px 6px', borderRadius: '4px' }}>{DEFAULT_FOLDER_NAME}</code>
      </p>

      <label style={{
        display: 'inline-block',
        padding: '12px 24px',
        backgroundColor: '#FFE3E8',
        color: '#FF477E',
        borderRadius: '50px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: 'none',
        boxShadow: '0 4px 10px rgba(255, 71, 126, 0.15)',
      }}>
        Choose Photo 🌸
        <input type="file" accept="image/*" onChange={onSelectFile} style={{ display: 'none' }} />
      </label>
      
      {imgSrc && (
        <div style={{ 
          marginTop: '25px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{
            border: '6px solid white',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            backgroundColor: 'white',
            maxWidth: '100%', 
          }}>
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
            >
              <img 
                ref={imgRef} 
                alt="Crop target" 
                src={imgSrc} 
                onLoad={onImageLoad} 
                style={{ maxHeight: '70vh', maxWidth: '100%', display: 'block' }}
              />
            </ReactCrop>
          </div>
          
          <button 
            onClick={saveCroppedImg}
            style={{ 
              padding: '12px 30px', 
              backgroundColor: '#FF477E', 
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(255, 71, 126, 0.3)',
              transition: 'transform 0.1s ease',
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Cutie Crop Done! 💕
          </button>
        </div>
      )}
    </div>
  );
}