import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SQRT_5000 = Math.sqrt(5000);

const testimonials = [
  {
    tempId: 0,
    testimonial: "ExportEase guided me through my very first export to UAE. What seemed impossible became simple with their step-by-step system.",
    by: "Tariq Mahmood, Rice Exporter",
    imgSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80"
  },
  {
    tempId: 1,
    testimonial: "The document generator saved us 3 weeks of back-and-forth. All our export documents were ready in hours.",
    by: "Sadia Farooq, Textile Startup",
    imgSrc: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80"
  },
  {
    tempId: 2,
    testimonial: "Country insights showed me Germany is the best market for our products. Doubled our revenue in 6 months.",
    by: "Hassan Raza, Spice Trader",
    imgSrc: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80"
  },
  {
    tempId: 3,
    testimonial: "ExportEase's products make planning for the future seamless. Can't recommend them enough!",
    by: "Marie, CFO at FuturePlanning",
    imgSrc: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80"
  },
  {
    tempId: 4,
    testimonial: "If I could give 11 stars, I'd give 12. Unbelievable platform.",
    by: "Andre, Head of Logistics at TradeCo",
    imgSrc: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80"
  },
  {
    tempId: 5,
    testimonial: "SO SO SO HAPPY WE FOUND YOU GUYS!!!! I'd bet you've saved me 100 hours so far.",
    by: "Jeremy, Product Manager at TimeWise",
    imgSrc: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80"
  }
];

const TestimonialCard = ({ position, testimonial, handleMove, cardSize }) => {
  const isCenter = position === 0;
  const [isHovered, setIsHovered] = useState(false);

  const baseStyle = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    cursor: 'pointer',
    border: '2px solid',
    padding: '32px',
    transition: 'all 0.5s ease-in-out',
    width: cardSize,
    height: cardSize,
    clipPath: 'polygon(50px 0%, calc(100% - 50px) 0%, 100% 50px, 100% 100%, calc(100% - 50px) 100%, 50px 100%, 0 100%, 0 0)',
    transform: `translate(-50%, -50%) translateX(${(cardSize / 1.5) * position}px) translateY(${isCenter ? -65 : position % 2 ? 15 : -15}px) rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)`,
  };

  const centerStyle = {
    zIndex: 10,
    backgroundColor: '#ffffff',
    color: '#000000',
    borderColor: '#ffffff',
    boxShadow: '0px 8px 0px 4px rgba(255, 255, 255, 0.1)',
  };

  const darkStyle = {
    zIndex: 0,
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    borderColor: isHovered ? 'rgba(255,255,255,0.4)' : '#333333',
    boxShadow: '0px 0px 0px 0px transparent'
  };

  const finalStyle = { ...baseStyle, ...(isCenter ? centerStyle : darkStyle) };

  return (
    <div
      onClick={() => handleMove(position)}
      style={finalStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span
        style={{
          position: 'absolute',
          display: 'block',
          transformOrigin: 'top right',
          transform: 'rotate(45deg)',
          backgroundColor: isCenter ? '#e2e8f0' : '#333333',
          right: -2,
          top: 48,
          width: SQRT_5000,
          height: 2
        }}
      />
      <img
        src={testimonial.imgSrc}
        alt={testimonial.by}
        style={{
          marginBottom: '16px',
          height: '56px',
          width: '48px',
          backgroundColor: '#e2e8f0',
          objectFit: 'cover',
          objectPosition: 'top',
          boxShadow: `3px 3px 0px ${isCenter ? 'rgba(0,0,0,0.1)' : '#000000'}`
        }}
      />
      <h3 style={{
        fontSize: cardSize > 300 ? '20px' : '16px',
        fontWeight: 500,
        color: isCenter ? '#000000' : '#ffffff',
        margin: '0 0 8px 0',
        lineHeight: 1.4
      }}>
        "{testimonial.testimonial}"
      </h3>
      <p style={{
        position: 'absolute',
        bottom: '32px',
        left: '32px',
        right: '32px',
        margin: 0,
        fontSize: '14px',
        fontStyle: 'italic',
        color: isCenter ? 'rgba(0,0,0,0.7)' : '#a1a1aa'
      }}>
        - {testimonial.by}
      </p>
    </div>
  );
};

const NavButton = ({ onClick, icon, ariaLabel }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={ariaLabel}
      style={{
        display: 'flex',
        height: '56px',
        width: '56px',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        transition: 'all 0.2s',
        backgroundColor: isHovered ? '#ffffff' : '#111111',
        color: isHovered ? '#000000' : '#ffffff',
        border: '2px solid #333333',
        cursor: 'pointer',
        borderRadius: '8px',
        outline: 'none'
      }}
    >
      {icon}
    </button>
  );
};

export const StaggerTestimonials = () => {
  const [cardSize, setCardSize] = useState(365);
  const [testimonialsList, setTestimonialsList] = useState(testimonials);

  const handleMove = (steps) => {
    const newList = [...testimonialsList];
    if (steps > 0) {
      for (let i = steps; i > 0; i--) {
        const item = newList.shift();
        if (!item) return;
        newList.push({ ...item, tempId: Math.random() });
      }
    } else {
      for (let i = steps; i < 0; i++) {
        const item = newList.pop();
        if (!item) return;
        newList.unshift({ ...item, tempId: Math.random() });
      }
    }
    setTestimonialsList(newList);
  };

  useEffect(() => {
    const updateSize = () => {
      const matches = window.matchMedia("(min-width: 640px)").matches;
      setCardSize(matches ? 365 : 290);
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden', height: 600 }}>
      {testimonialsList.map((testimonial, index) => {
        const position = index - Math.floor(testimonialsList.length / 2);
        return (
          <TestimonialCard
            key={testimonial.tempId}
            testimonial={testimonial}
            handleMove={handleMove}
            position={position}
            cardSize={cardSize}
          />
        );
      })}
      
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '12px',
        zIndex: 20
      }}>
        <NavButton onClick={() => handleMove(-1)} icon={<ChevronLeft size={24} />} ariaLabel="Previous testimonial" />
        <NavButton onClick={() => handleMove(1)} icon={<ChevronRight size={24} />} ariaLabel="Next testimonial" />
      </div>
    </div>
  );
};

export default StaggerTestimonials;
