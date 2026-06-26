import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Must set up worker for pdf.js to run in background
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfViewerModal({ isOpen, onClose, fileUrl, title }) {
  const [numPages, setNumPages] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);

  // Reset state when opening a new file
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1.0);
    }
  }, [isOpen, fileUrl]);

  // Lock body overflow scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle pinch to zoom (Trackpad and Touch)
  useEffect(() => {
    if (!isOpen) return;
    
    let initialPinchDistance = null;
    let initialZoom = 1.0;

    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        // e.deltaY is typically ~100 for a mouse wheel tick, less for trackpad.
        const scaleFactor = Math.exp(-e.deltaY / 200);
        setZoomLevel(prev => Math.min(Math.max(prev * scaleFactor, 0.5), 3.0));
      }
    };

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
        setZoomLevel(prev => {
          initialZoom = prev;
          return prev;
        });
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && initialPinchDistance) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);
        
        const scaleFactor = currentDistance / initialPinchDistance;
        setZoomLevel(Math.min(Math.max(initialZoom * scaleFactor, 0.5), 3.0));
      }
    };

    const handleTouchEnd = (e) => {
      if (e.touches.length < 2) {
        initialPinchDistance = null;
      }
    };

    const container = document.getElementById('pdf-scroll-container');
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [isOpen]);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 3.0));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.5));

  // Render the PDF canvases at 1.5x resolution to keep them crisp when zoomed in via CSS
  const BASE_RESOLUTION = 1.5;

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-surface-900/95 backdrop-blur-md">
      <div className="flex-1 flex flex-col h-full w-full">
        {/* Header Controls */}
        <div className="h-16 border-b border-surface-700 bg-surface-900 flex items-center justify-between px-4 shadow-md flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-surface-800 rounded-xl transition-colors text-surface-400 hover:text-white"
              title="Close Viewer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-surface-700 mx-1"></div>
            <h2 className="text-sm font-bold text-white truncate max-w-[200px] md:max-w-md">
              {title || "Document"}
            </h2>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Pagination Info */}
            <div className="flex items-center bg-surface-800 rounded-lg p-1 border border-surface-700">
              <span className="text-xs font-medium px-3 text-surface-300 whitespace-nowrap">
                {numPages ? `${numPages} Pages` : '-- Pages'}
              </span>
            </div>

            {/* Zoom Controls */}
            <div className="hidden md:flex items-center bg-surface-800 rounded-lg p-1 border border-surface-700">
              <button 
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                className="p-1.5 hover:bg-surface-700 rounded-md transition-colors text-surface-300 disabled:opacity-30"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium px-2 text-surface-300 w-12 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button 
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3.0}
                className="p-1.5 hover:bg-surface-700 rounded-md transition-colors text-surface-300 disabled:opacity-30"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <a 
              href={fileUrl} 
              download
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex p-2 hover:bg-surface-800 rounded-xl transition-colors text-surface-400 hover:text-white"
              title="Download PDF"
            >
              <Download className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* PDF Content Area */}
        <div id="pdf-scroll-container" className="flex-1 overflow-auto bg-surface-900/50 flex justify-center py-8 px-4 custom-scrollbar">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex flex-col items-center justify-center text-brand-400 h-64 gap-4 mt-20">
                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium animate-pulse">Loading Document...</span>
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center text-red-400 h-64 gap-2 bg-surface-800 p-8 rounded-xl border border-surface-700 mt-20">
                <span className="font-bold">Failed to load PDF</span>
                <span className="text-sm text-surface-400">The file might be unavailable or corrupted.</span>
              </div>
            }
          >
            <div 
              className="flex flex-col gap-6 items-center origin-top" 
              style={{ zoom: zoomLevel }}
            >
              {Array.from(new Array(numPages || 0), (el, index) => (
                <div
                  key={`page_${index + 1}`}
                  className="shadow-2xl shadow-black/50 bg-white rounded-md overflow-hidden"
                >
                  <Page 
                    pageNumber={index + 1} 
                    scale={BASE_RESOLUTION} 
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={<div className="h-[800px] w-[600px] bg-white/5" />}
                  />
                </div>
              ))}
            </div>
          </Document>
        </div>
      </div>
    </div>,
    document.body
  );
}
