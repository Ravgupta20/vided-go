import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ImageCropper from './components/ImageCrop';
import AudioMarker from './components/AudioMarker';
import FilterPreview from './components/FilterPreview/FilterPreview';
import Home from './components/Home';

export default function App() {
  return (

    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/crop" element={<ImageCropper />} />
      <Route path="/marker" element={<AudioMarker />} />
      <Route path="/filters" element={<FilterPreview />} />
    </Routes>
  </BrowserRouter>
  );
}
