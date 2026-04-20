/**
 * SparklesCore — tsParticles ambient particle effect
 *
 * Adapted from Aceternity UI (TypeScript/Tailwind) to plain
 * JavaScript + CSS variables (DevLens Neural Obsidian system).
 *
 * Dependencies (already installed):
 *   framer-motion, @tsparticles/react, @tsparticles/slim, @tsparticles/engine
 *
 * Usage:
 *   <SparklesCore particleColor="#4f9eff" particleDensity={80} />
 */

import { useId, useEffect, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { motion, useAnimation } from 'framer-motion';
import './SparklesCore.css';

/**
 * @param {object}  props
 * @param {string}  [props.id]               — Unique DOM id for the canvas
 * @param {string}  [props.className]         — Extra class names on root wrapper
 * @param {string}  [props.background]        — Canvas background color (default transparent)
 * @param {number}  [props.minSize]           — Minimum particle size  (default 1)
 * @param {number}  [props.maxSize]           — Maximum particle size  (default 3)
 * @param {number}  [props.speed]             — Opacity animation speed (default 4)
 * @param {string}  [props.particleColor]     — Particle hex color      (default #ffffff)
 * @param {number}  [props.particleDensity]   — Particle count          (default 120)
 */
export function SparklesCore({
  id,
  className = '',
  background = 'transparent',
  minSize = 1,
  maxSize = 3,
  speed = 4,
  particleColor = '#ffffff',
  particleDensity = 120,
}) {
  const [init, setInit] = useState(false);
  const controls   = useAnimation();
  const generatedId = useId();

  // Boot the tsParticles engine once on first mount
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setInit(true));
  }, []);

  const particlesLoaded = async (container) => {
    if (container) {
      controls.start({
        opacity: 1,
        transition: { duration: 1 },
      });
    }
  };

  return (
    <motion.div
      animate={controls}
      className={['sparkles-root', className].filter(Boolean).join(' ')}
      style={{ opacity: 0 }}          /* framer-motion drives this to 1 */
    >
      {init && (
        <Particles
          id={id || generatedId}
          className="sparkles-canvas"
          particlesLoaded={particlesLoaded}
          options={{
            background: {
              color: { value: background },
            },
            fullScreen: {
              enable: false,
              zIndex: 1,
            },
            fpsLimit: 120,
            interactivity: {
              events: {
                onClick:  { enable: true,  mode: 'push'    },
                onHover:  { enable: true,  mode: 'repulse' },
                resize:   true,
              },
              modes: {
                push:    { quantity: 6 },
                repulse: { 
                  distance: 150, 
                  duration: 0.8, 
                  factor: 1, 
                  speed: 1,
                  easing: "ease-out-quad" 
                },
              },
            },
            particles: {
              color:  { value: particleColor },
              move: {
                direction: 'none',
                enable: true,
                random:   false,
                speed:    { min: 0.1, max: 1 },
                straight: false,
                outModes: { default: 'out' },
              },
              number: {
                density: {
                  enable: true,
                  width:  400,
                  height: 400,
                },
                value: particleDensity,
              },
              opacity: {
                value: { min: 0.1, max: 1 },
                animation: {
                  enable:     true,
                  speed:      speed,
                  sync:       false,
                  mode:       'auto',
                  startValue: 'random',
                  destroy:    'none',
                },
              },
              shape: {
                type: 'circle',
              },
              size: {
                value: { min: minSize, max: maxSize },
              },
              collisions: { enable: false },
            },
            detectRetina: true,
          }}
        />
      )}
    </motion.div>
  );
}

export default SparklesCore;
