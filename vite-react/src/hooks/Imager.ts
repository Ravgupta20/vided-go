import {useState,  useRef} from "react";

interface LocalImage {
  name: string;
  url: string;
  handle?: any;
}   


  const isImageFile = (fileName: string) =>
    /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(fileName);


export const  useImager = () => {
    const [images, setImages] = useState<LocalImage[]>([]);
    const [selectedImage, setSelectedImage] = useState<LocalImage | null>(null);
    const [rootDirectoryHandle, setRootDirectoryHandle] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    
  
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

  return {
    images,
    selectedImage,
    setSelectedImage,
    handleOpenDirectory,
    handleDeleteImage,
    fileInputRef,
  };
};