import { useEffect, useState } from 'react';

const heroCarouselFiles = [
  'Ella.jpg',
  'Galle.jpg',
  'Jaffna.jpg',
  'Kandy.jpg',
  'Sigiriya.jpg',
  'Yala.jpg',
];

export const heroCarouselImages = heroCarouselFiles
  .sort((first, second) => first.localeCompare(second))
  .map((fileName) => ({
    fileName,
    src: `/images/hero_carousel/${fileName}`,
    title: fileName
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (character) => character.toUpperCase()),
  }));

export function useHeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (heroCarouselImages.length < 2) return undefined;
    const interval = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setActiveIndex((index) => (index + 1) % heroCarouselImages.length);
        setVisible(true);
      }, 250);
    }, 4000);
    return () => window.clearInterval(interval);
  }, []);

  return { image: heroCarouselImages[activeIndex], visible };
}
