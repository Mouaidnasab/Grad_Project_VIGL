import React, { useEffect, useRef } from 'react';
import './LogoCarousel.css';  
import logo from '../images/logo.png';

const LogoCarousel = () => {
  const carouselRef = useRef(null);

  useEffect(() => {
    const carousel = carouselRef.current;
    const totalWidth = carousel.scrollWidth;
    const handleAnimation = () => {
      if (carousel.scrollLeft >= totalWidth / 2) {
        carousel.scrollLeft = 0;
      }
    };

    carousel.addEventListener('scroll', handleAnimation);

    return () => {
      carousel.removeEventListener('scroll', handleAnimation);
    };
  }, []);

  return (
    <div className="logo-carousel-container">
      <div className="logo-carousel" ref={carouselRef}>
        {/* Duplicate the images to create an infinite loop effect */}
        {[...Array(100)].map((_, index) => (
          <img
            key={index}
            src={logo}
            alt="Logo"
            className="logo-image"
          />
        ))}
        {[...Array(100)].map((_, index) => (
          <img
            key={`duplicate-${index}`}
            src={logo}
            alt="Logo"
            className="logo-image"
          />
        ))}
        {[...Array(100)].map((_, index) => (
          <img
            key={`duplicate-${index}`}
            src={logo}
            alt="Logo"
            className="logo-image"
          />
        ))}
        {[...Array(100)].map((_, index) => (
          <img
            key={`duplicate-${index}`}
            src={logo}
            alt="Logo"
            className="logo-image"
          />
        ))}
        {[...Array(100)].map((_, index) => (
          <img
            key={`duplicate-${index}`}
            src={logo}
            alt="Logo"
            className="logo-image"
          />
        ))}
      </div>
    </div>
  );
};

export default LogoCarousel;
