import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getDriveImageUrl } from '../services/api';

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      if (e.key === 'ArrowLeft') setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length, onClose]);

  if (!images || images.length === 0) return null;

  // Usa o getDriveImageUrl para garantir que a imagem não vem como página HTML do Drive
  const currentImageUrl = getDriveImageUrl(images[currentIndex].trim());

  return createPortal(
    <div 
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10000, backdropFilter: 'blur(10px)'
      }} 
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        style={{
          position: 'absolute', top: '1.5rem', right: '1.5rem',
          background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
          width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', cursor: 'pointer', zIndex: 10001
        }}
      >
        <X size={24} />
      </button>

      {images.length > 1 && (
        <button 
          onClick={handlePrev}
          style={{
            position: 'absolute', left: '1rem',
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
            width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', cursor: 'pointer', zIndex: 10001
          }}
        >
          <ChevronLeft size={32} />
        </button>
      )}

      <img 
        src={currentImageUrl} 
        alt={`Visualização ${currentIndex + 1}`} 
        style={{
          maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain',
          borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
        }} 
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <button 
          onClick={handleNext}
          style={{
            position: 'absolute', right: '1rem',
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
            width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', cursor: 'pointer', zIndex: 10001
          }}
        >
          <ChevronRight size={32} />
        </button>
      )}

      {images.length > 1 && (
        <div style={{
          position: 'absolute', bottom: '1.5rem',
          background: 'rgba(0,0,0,0.5)', padding: '0.5rem 1rem', borderRadius: '20px',
          color: 'white', fontSize: '0.9rem', fontWeight: 600
        }}>
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>,
    document.body
  );
};
