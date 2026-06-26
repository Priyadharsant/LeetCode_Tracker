import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, ExternalLink } from 'lucide-react';
import YoutubeIcon from './YoutubeIcon';

export default function VideoModal({ isOpen, onClose, videoId, problemName }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [dynamicVideoId, setDynamicVideoId] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    let timeoutId;
    if (isOpen) {
      setShouldRender(true);
      // Small timeout to allow DOM mounting before starting transition
      timeoutId = setTimeout(() => {
        setAnimate(true);
      }, 10);
    } else {
      setAnimate(false);
      // Wait for transition duration (300ms) to complete before unmounting
      timeoutId = setTimeout(() => {
        setShouldRender(false);
      }, 300);
    }
    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsLoaded(false); 
      
      if (videoId) {
        setDynamicVideoId(videoId);
      } else {
        // Dynamically fetch using YouTube API
        const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
        if (!API_KEY) {
          setDynamicVideoId(null);
          return;
        }

        setIsFetching(true);
        fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(problemName)}&channelId=UC_mYaQAE6-71rjSN6CeCA-g&maxResults=1&type=video&key=${API_KEY}`)
          .then(res => res.json())
          .then(data => {
            if (data.items && data.items.length > 0) {
              setDynamicVideoId(data.items[0].id.videoId);
            } else {
              // Not found in NeetCode's channel, redirect directly to general YouTube search
              setDynamicVideoId(null);
              onClose();
              window.open(`https://www.youtube.com/results?search_query=NeetCode+${encodeURIComponent(problemName)}`, '_blank');
            }
          })
          .catch(err => {
            console.error("YouTube API Error:", err);
            setDynamicVideoId(null);
          })
          .finally(() => {
            setIsFetching(false);
          });
      }
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, videoId, problemName]);

  const handleSearchYouTube = () => {
    window.open(`https://www.youtube.com/results?search_query=NeetCode+${encodeURIComponent(problemName)}`, '_blank');
  };

  if (!shouldRender) return null;

  return createPortal(
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-opacity duration-300 ${animate ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      
      <div
        className={`relative w-full max-w-4xl bg-surface-900 border border-surface-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col transition-all duration-300 transform ${
          animate ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800 bg-surface-900/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 text-red-500">
              <YoutubeIcon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white truncate max-w-[200px] sm:max-w-md">
              {problemName} Solution
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="relative w-full aspect-video bg-black flex flex-col items-center justify-center">
          {(isFetching || !isLoaded) && dynamicVideoId !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
                {isFetching && <span className="text-sm text-surface-400 font-medium">Searching YouTube...</span>}
              </div>
            </div>
          )}
          
          {dynamicVideoId ? (
            <iframe
              className={`w-full h-full transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
              src={`https://www.youtube.com/embed/${dynamicVideoId}?autoplay=1&rel=0&modestbranding=1`}
              title={`${problemName} YouTube video player`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onLoad={() => setIsLoaded(true)}
            ></iframe>
          ) : !isFetching ? (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-surface-900/50 w-full h-full">
              <div className="w-16 h-16 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-surface-500" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Video Not Found</h4>
              <p className="text-surface-400 max-w-md mb-6">
                {import.meta.env.VITE_YOUTUBE_API_KEY 
                  ? "We couldn't automatically find a highly relevant video for this problem. You can search YouTube manually!"
                  : "To automatically search and play videos inside the app, please add your VITE_YOUTUBE_API_KEY to your frontend .env file."}
              </p>
              <button
                onClick={handleSearchYouTube}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all shadow-lg shadow-red-500/20"
              >
                Search NeetCode on YouTube
                <ExternalLink className="w-4 h-4 ml-1" />
              </button>
            </div>
          ) : null}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-3 border-t border-surface-800 bg-surface-900/30 flex justify-between items-center text-xs text-surface-500">
          <p>
            {dynamicVideoId ? (videoId ? "Explanation by NeetCode (Direct Link)" : "Auto-playing first YouTube search result") : "Video Search"}
          </p>
          <a 
            href={dynamicVideoId 
              ? `https://www.youtube.com/watch?v=${dynamicVideoId}` 
              : `https://www.youtube.com/results?search_query=NeetCode+${encodeURIComponent(problemName)}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-brand-400 transition-colors"
          >
            Watch on YouTube <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
}
