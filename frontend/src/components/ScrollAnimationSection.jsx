import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import './ScrollAnimationSection.css';

export default function ScrollAnimationSection() {
  const containerRef = useRef(null);
  const sectionRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [phase, setPhase] = useState('initial'); // 'initial', 'zoom', 'locked', 'slideIn'

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const sectionTop = sectionRef.current.offsetTop;
      const sectionHeight = sectionRef.current.offsetHeight;
      const windowHeight = window.innerHeight;
      
      // Calculate scroll progress within this section
      const scrollTop = window.scrollY;
      const distanceFromTop = scrollTop - sectionTop;
      const progress = Math.max(0, Math.min(1, distanceFromTop / (sectionHeight - windowHeight)));

      setScrollProgress(progress);

      // Determine phase based on progress
      if (progress < 0.4) {
        setPhase('zoom');
      } else if (progress < 0.6) {
        setPhase('locked');
      } else {
        setPhase('slideIn');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Phase 1: Card 2 zoom animation (0% to 40%)
  const zoomProgress = Math.min(1, scrollProgress / 0.4);
  
  // Scale from small (1) to large (2.8)
  const card2Scale = 1 + (2.8 - 1) * zoomProgress;
  
  // Move from bottom position to center
  const card2Y = (1 - zoomProgress) * 100;
  
  // Text slides up as card zooms
  const textTranslateY = (1 - zoomProgress) * 60;

  // ── Phase 2: Cards slide in (40% to 100%)
  const slideProgress = Math.max(0, (scrollProgress - 0.4) / 0.6);
  
  // Cards 1 and 3 slide in from sides
  const card1X = -150 + slideProgress * 150;
  const card3X = 150 - slideProgress * 150;

  // Cards 1 and 3 fade in
  const sideCardOpacity = slideProgress;

  return (
    <div ref={containerRef} className="scroll-animation-section">
      <div ref={sectionRef} className="scroll-animation-section__container">
        
        {/* Fade overlay for hero content */}
        <motion.div
          className="scroll-animation-section__fade-overlay"
          style={{
            opacity: zoomProgress * 0.7,
          }}
          aria-hidden="true"
        />

        {/* Cards Container - Sticky */}
        <div className="scroll-animation-section__sticky-wrapper">
          <div className="scroll-animation-section__cards-grid">
            
            {/* CARD 1 (Left) - Slides in from left */}
            <motion.div
              className="scroll-animation-section__card scroll-animation-section__card--left"
              style={{
                opacity: sideCardOpacity,
                x: card1X,
                pointerEvents: slideProgress > 0 ? 'auto' : 'none',
              }}
            >
              <div className="scroll-animation-section__card-inner">
                <div className="scroll-animation-section__card-header">
                  <span className="scroll-animation-section__card-icon">📊</span>
                  <h3 className="scroll-animation-section__card-title">Visual Metrics</h3>
                </div>
                <p className="scroll-animation-section__card-desc">
                  Interactive charts and graphs that surface codebase patterns.
                </p>
              </div>
            </motion.div>

            {/* CARD 2 (Center) - Zooms and centers */}
            <motion.div
              className="scroll-animation-section__card scroll-animation-section__card--center"
              style={{
                scale: card2Scale,
                y: card2Y,
                zIndex: 20,
              }}
            >
              <div className="scroll-animation-section__card-inner scroll-animation-section__card-inner--with-text-animation">
                <div className="scroll-animation-section__card-header">
                  <span className="scroll-animation-section__card-icon">🔬</span>
                  <h3 className="scroll-animation-section__card-title">Analyze Repositories</h3>
                </div>
                
                {/* Text content with slide-up animation */}
                <div className="scroll-animation-section__text-wrapper" style={{ overflow: 'hidden' }}>
                  <motion.div
                    className="scroll-animation-section__text-inner"
                    style={{
                      y: textTranslateY,
                    }}
                  >
                    <p className="scroll-animation-section__card-subtitle">
                      AI-powered insights into any GitHub repo.
                    </p>
                    <p className="scroll-animation-section__card-desc">
                      Understand structure, detect patterns, and get recommendations for improvement.
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* CARD 3 (Right) - Slides in from right */}
            <motion.div
              className="scroll-animation-section__card scroll-animation-section__card--right"
              style={{
                opacity: sideCardOpacity,
                x: card3X,
                pointerEvents: slideProgress > 0 ? 'auto' : 'none',
              }}
            >
              <div className="scroll-animation-section__card-inner">
                <div className="scroll-animation-section__card-header">
                  <span className="scroll-animation-section__card-icon">⚡</span>
                  <h3 className="scroll-animation-section__card-title">Instant Results</h3>
                </div>
                <p className="scroll-animation-section__card-desc">
                  Real-time metrics and insights delivered instantly.
                </p>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Spacer to allow scrolling */}
        <div className="scroll-animation-section__spacer" />
      </div>
    </div>
  );
}
