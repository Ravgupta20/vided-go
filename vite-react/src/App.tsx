import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ImageCropper from './components/ImageCrop';
import AudioMarker from './components/AudioMarker';

export default function App() {
  return (

    <BrowserRouter>
    <Routes>
      <Route path="/crop" element={<ImageCropper />} />
      <Route path="/marker" element={<AudioMarker />} />
    </Routes>
  </BrowserRouter>
  );
}
