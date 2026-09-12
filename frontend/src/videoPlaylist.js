import { useCallback, useEffect, useRef, useState } from 'react';

export const videoPlaylist = [
  '/videos/Ambuluwawa.mp4',
  '/videos/Ella.mp4',
  '/videos/Galla.mp4',
  '/videos/Sigiriya.mp4',
];

export function useVideoPlaylist() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRef = useRef(null);
  const isSwitching = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    video.src = videoPlaylist[0];
    video.load();
    video.play().catch(() => {});
    isSwitching.current = false;
    return () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, []);

  const switchToNextVideo = useCallback(() => {
    if (isSwitching.current) return;

    isSwitching.current = true;
    const nextVideoIndex = (currentVideoIndex + 1) % videoPlaylist.length;
    setCurrentVideoIndex(nextVideoIndex);
    const video = videoRef.current;
    const nextSource = videoPlaylist[nextVideoIndex];
    if (video && !video.currentSrc.endsWith(nextSource) && !video.src.endsWith(nextSource)) {
      video.src = nextSource;
      video.load();
      video.play().catch(() => {});
    }
    isSwitching.current = false;
  }, [currentVideoIndex]);

  return {
    currentVideoIndex,
    videoRef,
    switchToNextVideo,
  };
}