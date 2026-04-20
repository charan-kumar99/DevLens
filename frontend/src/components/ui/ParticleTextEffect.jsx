/**
 * ParticleTextEffect
 *
 * Canvas-based particle system that renders words and animates
 * between them every 4 seconds. Right-click + drag to destroy particles.
 *
 * Adapted from TypeScript → plain JS.
 * Removals: type annotations, interface declarations, "use client",
 *   CanvasRenderingContext2D type casts.
 * No external npm dependencies.
 *
 * Usage:
 *   import { ParticleTextEffect } from '../components/ui/ParticleTextEffect';
 *
 *   // Default word cycle
 *   <ParticleTextEffect />
 *
 *   // Custom words + container class
 *   <ParticleTextEffect
 *     words={['DEVLENS', 'ANALYZE', 'DISCOVER']}
 *     className="my-canvas-wrap"
 *   />
 */

import { useEffect, useRef } from 'react';
import './ParticleTextEffect.css';

/* ── Particle class ── */
class Particle {
  constructor() {
    this.pos    = { x: 0, y: 0 };
    this.vel    = { x: 0, y: 0 };
    this.acc    = { x: 0, y: 0 };
    this.target = { x: 0, y: 0 };

    this.closeEnoughTarget = 100;
    this.maxSpeed  = 1.0;
    this.maxForce  = 0.1;
    this.particleSize = 10;
    this.isKilled  = false;

    this.startColor   = { r: 0, g: 0, b: 0 };
    this.targetColor  = { r: 0, g: 0, b: 0 };
    this.colorWeight  = 0;
    this.colorBlendRate = 0.01;
  }

  move() {
    let proximityMult = 1;
    const dx = this.target.x - this.pos.x;
    const dy = this.target.y - this.pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < this.closeEnoughTarget) {
      proximityMult = distance / this.closeEnoughTarget;
    }

    const mag = Math.sqrt(dx * dx + dy * dy) || 1;
    const tx = (dx / mag) * this.maxSpeed * proximityMult;
    const ty = (dy / mag) * this.maxSpeed * proximityMult;

    const sx = tx - this.vel.x;
    const sy = ty - this.vel.y;
    const sm = Math.sqrt(sx * sx + sy * sy) || 1;
    this.acc.x += (sx / sm) * this.maxForce;
    this.acc.y += (sy / sm) * this.maxForce;

    this.vel.x += this.acc.x;
    this.vel.y += this.acc.y;
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
    this.acc.x = 0;
    this.acc.y = 0;
  }

  draw(ctx, drawAsPoints) {
    if (this.colorWeight < 1.0) {
      this.colorWeight = Math.min(this.colorWeight + this.colorBlendRate, 1.0);
    }
    const r = Math.round(this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight);
    const g = Math.round(this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight);
    const b = Math.round(this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight);

    ctx.fillStyle = `rgb(${r},${g},${b})`;
    if (drawAsPoints) {
      ctx.fillRect(this.pos.x, this.pos.y, 2, 2);
    } else {
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.particleSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  kill(width, height) {
    if (!this.isKilled) {
      const rp = randomPos(width / 2, height / 2, (width + height) / 2);
      this.target.x = rp.x;
      this.target.y = rp.y;
      this.startColor = {
        r: this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight,
        g: this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight,
        b: this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight,
      };
      this.targetColor = { r: 0, g: 0, b: 0 };
      this.colorWeight = 0;
      this.isKilled    = true;
    }
  }
}

function randomPos(x, y, mag) {
  // Generate a totally random angle in radians
  const angle = Math.random() * Math.PI * 2;
  // Use trig to find the exact point strictly on a circle perimeter of radius 'mag'
  return {
    x: x + Math.cos(angle) * Math.max(mag, 800), // Ensure radius is always huge
    y: y + Math.sin(angle) * Math.max(mag, 800)
  };
}

const DEFAULT_WORDS = ['DEVLENS', 'ANALYZE', 'DISCOVER', 'COMPARE', 'INSIGHTS'];
const PIXEL_STEPS   = 6;
const DRAW_AS_POINTS = true;

/**
 * @param {object}   props
 * @param {string[]} [props.words]     — list of words to cycle through
 * @param {string}   [props.className] — extra class on the root div
 */
export function ParticleTextEffect({ words = DEFAULT_WORDS, className = '' }) {
  const canvasRef      = useRef(null);
  const animationRef   = useRef(null);
  const particlesRef   = useRef([]);
  const frameCountRef  = useRef(0);
  const wordIndexRef   = useRef(0);
  const mouseRef       = useRef({ x: 0, y: 0, isPressed: false, isRightClick: false });

  // The "visible" center of the effect — mid-screen in canvas-space
  // Canvas is 2500x1200, visible viewport ~1400x600, centered via CSS
  // So the visible center in canvas coords = canvas.width/2, canvas.height/2
  const VISIBLE_CX = 1250;
  const VISIBLE_CY = 600;
  // Spawn ring radius: big enough to be off-screen but small enough to travel fast
  const SPAWN_RADIUS = 900;

  // Vivid neon colors so particles are always visible
  const NEON_COLORS = [
    { r: 79,  g: 158, b: 255 }, // Electric blue
    { r: 167, g: 139, b: 250 }, // AI purple
    { r: 0,   g: 255, b: 180 }, // Neon cyan-green
    { r: 255, g: 80,  b: 180 }, // Hot pink
    { r: 255, g: 165, b: 0   }, // Orange
    { r: 0,   g: 220, b: 255 }, // Cyan
  ];
  let colorIdx = 0;

  /* ── Render word to offscreen canvas and convert pixels → particles ── */
  function nextWord(word, canvas) {
    const oc  = document.createElement('canvas');
    oc.width  = canvas.width;
    oc.height = canvas.height;
    const octx = oc.getContext('2d');

    // Draw text at the VISIBLE center of the giant canvas
    octx.fillStyle    = 'white';
    octx.font         = 'bold 100px Arial';
    octx.textAlign    = 'center';
    octx.textBaseline = 'middle';
    octx.fillText(word, VISIBLE_CX, VISIBLE_CY);

    const imageData = octx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels    = imageData.data;

    // Pick next vivid neon color in rotation
    const newColor = NEON_COLORS[colorIdx % NEON_COLORS.length];
    colorIdx++;

    const particles  = particlesRef.current;
    let   pidx       = 0;

    /* Shuffle pixel coords for fluid dispersal */
    const coordIdxs = [];
    for (let i = 0; i < pixels.length; i += PIXEL_STEPS * 4) coordIdxs.push(i);
    for (let i = coordIdxs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [coordIdxs[i], coordIdxs[j]] = [coordIdxs[j], coordIdxs[i]];
    }

    for (const ci of coordIdxs) {
      if (pixels[ci + 3] > 0) {
        const x = (ci / 4) % canvas.width;
        const y = Math.floor(ci / 4 / canvas.width);

        let p;
        if (pidx < particles.length) {
          p = particles[pidx];
          p.isKilled = false;
          // Teleport to spawn ring so they fly in from outside
          const rp = randomPos(VISIBLE_CX, VISIBLE_CY, SPAWN_RADIUS);
          p.pos.x = rp.x;
          p.pos.y = rp.y;
          p.vel.x = 0;
          p.vel.y = 0;
          pidx++;
        } else {
          p = new Particle();
          const rp2 = randomPos(VISIBLE_CX, VISIBLE_CY, SPAWN_RADIUS);
          p.pos.x = rp2.x;
          p.pos.y = rp2.y;
          p.maxSpeed       = Math.random() * 6 + 4;
          p.maxForce       = p.maxSpeed * 0.05;
          p.particleSize   = Math.random() * 6 + 6;
          p.colorBlendRate = Math.random() * 0.0275 + 0.0025;
          particles.push(p);
        }

        p.startColor = {
          r: p.startColor.r + (p.targetColor.r - p.startColor.r) * p.colorWeight,
          g: p.startColor.g + (p.targetColor.g - p.startColor.g) * p.colorWeight,
          b: p.startColor.b + (p.targetColor.b - p.startColor.b) * p.colorWeight,
        };
        p.targetColor  = newColor;
        p.colorWeight  = 0;
        p.target.x     = x;
        p.target.y     = y;
      }
    }
    for (let i = pidx; i < particles.length; i++) {
      particles[i].kill(canvas.width, canvas.height);
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = 2500;
    canvas.height = 1200;
    nextWord(words[0], canvas);

    const animate = () => {
      const ctx = canvas.getContext('2d');
      const ps  = particlesRef.current;

      // Transparent background so the aurora shader shows through!
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = ps.length - 1; i >= 0; i--) {
        ps[i].move();
        ps[i].draw(ctx, DRAW_AS_POINTS);
        if (ps[i].isKilled) {
          const { x, y } = ps[i].pos;
          if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) {
            ps.splice(i, 1);
          }
        }
      }

      /* Right-click drag destroys nearby particles */
      if (mouseRef.current.isPressed && mouseRef.current.isRightClick) {
        ps.forEach((p) => {
          const dx = p.pos.x - mouseRef.current.x;
          const dy = p.pos.y - mouseRef.current.y;
          if (Math.sqrt(dx * dx + dy * dy) < 50) {
            p.kill(canvas.width, canvas.height);
          }
        });
      }

      frameCountRef.current++;
      if (frameCountRef.current % 360 === 0) {  // 6 seconds at 60fps — enough time to read
        wordIndexRef.current = (wordIndexRef.current + 1) % words.length;
        nextWord(words[wordIndexRef.current], canvas);
      }

      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    const onDown  = (e) => {
      mouseRef.current.isPressed     = true;
      mouseRef.current.isRightClick  = e.button === 2;
      const r = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - r.left;
      mouseRef.current.y = e.clientY - r.top;
    };
    const onUp    = () => { mouseRef.current.isPressed = false; mouseRef.current.isRightClick = false; };
    const onMove  = (e) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - r.left;
      mouseRef.current.y = e.clientY - r.top;
    };
    const onCtx   = (e) => e.preventDefault();

    canvas.addEventListener('mousedown',   onDown);
    canvas.addEventListener('mouseup',     onUp);
    canvas.addEventListener('mousemove',   onMove);
    canvas.addEventListener('contextmenu', onCtx);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      canvas.removeEventListener('mousedown',   onDown);
      canvas.removeEventListener('mouseup',     onUp);
      canvas.removeEventListener('mousemove',   onMove);
      canvas.removeEventListener('contextmenu', onCtx);
    };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={['particle-text-root', className].filter(Boolean).join(' ')}>
      <canvas ref={canvasRef} className="particle-text-canvas-title" />
    </div>
  );
}

export default ParticleTextEffect;
