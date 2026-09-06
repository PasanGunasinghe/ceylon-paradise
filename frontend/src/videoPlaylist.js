import { useEffect, useRef, useState } from 'react';

export const videoPlaylist = [
  '/videos/Ambuluwawa.mp4',
  '/videos/Ella.mp4',
  '/videos/Galla.mp4',
  '/videos/Sigiriya.mp4',
];

export function useVideoPlaylist() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [activeVideoSlot, setActiveVideoSlot] = useState(0);
  const [videoSources, setVideoSources] = useState([videoPlaylist[0], videoPlaylist[1]]);
  const videoRefs = useRef([null, null]);
  const isSwitching = useRef(false);

  useEffect(() => {
    const activeVideo = videoRefs.current[activeVideoSlot];
    const inactiveVideo = videoRefs.current[1 - activeVideoSlot];

    videoRefs.current.forEach((video) => {
      if (video) video.playbackRate = 1.5;
    });
    inactiveVideo?.load();
    inactiveVideo?.pause();
    activeVideo?.play().catch(() => {});
    isSwitching.current = false;
  }, [activeVideoSlot, currentVideoIndex, videoSources]);

  const switchToNextVideo = () => {
    if (isSwitching.current) return;

    isSwitching.current = true;
    const nextVideoIndex = (currentVideoIndex + 1) % videoPlaylist.length;
    const nextVideoSlot = 1 - activeVideoSlot;

    setVideoSources((previousSources) => {
      const nextSources = [...previousSources];
      nextSources[nextVideoSlot] = videoPlaylist[nextVideoIndex];
      nextSources[activeVideoSlot] = videoPlaylist[(nextVideoIndex + 1) % videoPlaylist.length];
      return nextSources;
    });
    setCurrentVideoIndex(nextVideoIndex);
    setActiveVideoSlot(nextVideoSlot);
  };

  const handleTimeUpdate = (slot, event) => {
    if (slot === activeVideoSlot && event.currentTarget.duration - event.currentTarget.currentTime <= 0.5) {
      switchToNextVideo();
    }
  };

  return {
    activeVideoSlot,
    handleTimeUpdate,
    setVideoRef: (slot) => (element) => {
      videoRefs.current[slot] = element;
    },
    switchToNextVideo,
    videoSources,
  };
}