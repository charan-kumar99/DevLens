/**
 * Lightning — WebGL animated lightning shader
 * HeroOdyssey — full hero section with Lightning, floating labels,
 *   elastic hue slider
 *
 * Adapted from TypeScript/Tailwind → plain JS + CSS.
 * Removals: TypeScript types, React.FC, Tailwind utilities
 *           (replaced with CSS classes), cn() not used in source
 * Dependencies: framer-motion (already installed)
 *
 * Exports:
 *   Lightning     — standalone WebGL canvas shader
 *   HeroOdyssey   — complete hero section component
 *   FeatureItem   — positioned label with glowing dot
 *   ElasticHueSlider — animated range input
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './HeroOdyssey.css';

/* ══════════════════════════════════════
   Lightning — WebGL shader
════════════════════════════════════════ */
const LIGHTNING_VERTEX = `
  attribute vec2 aPosition;
  void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const LIGHTNING_FRAGMENT = `
  precision mediump float;
  uniform vec2  iResolution;
  uniform float iTime;
  uniform float uHue;
  uniform float uXOffset;
  uniform float uSpeed;
  uniform float uIntensity;
  uniform float uSize;

  #define OCTAVE_COUNT 10

  vec3 hsv2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);
    return c.z * mix(vec3(1.0), rgb, c.y);
  }

  float hash11(float p) {
    p = fract(p * .1031); p *= p+33.33; p *= p+p;
    return fract(p);
  }

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx)*.1031);
    p3 += dot(p3, p3.yzx+33.33);
    return fract((p3.x+p3.y)*p3.z);
  }

  mat2 rotate2d(float theta) {
    float c=cos(theta), s=sin(theta);
    return mat2(c,-s,s,c);
  }

  float noise(vec2 p) {
    vec2 ip=floor(p), fp=fract(p);
    float a=hash12(ip), b=hash12(ip+vec2(1,0)), c=hash12(ip+vec2(0,1)), d=hash12(ip+vec2(1,1));
    vec2 t=smoothstep(0.0,1.0,fp);
    return mix(mix(a,b,t.x),mix(c,d,t.x),t.y);
  }

  float fbm(vec2 p) {
    float v=0.0, amp=0.5;
    for(int i=0;i<OCTAVE_COUNT;++i){
      v+=amp*noise(p);
      p=rotate2d(0.45)*p*2.0+vec2(100);
      amp*=0.5;
    }
    return v;
  }

  void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord/iResolution.xy;
    uv = 2.0*uv-1.0;
    uv.x *= iResolution.x/iResolution.y;
    uv.x += uXOffset;
    uv += 2.0*fbm(uv*uSize + 0.8*iTime*uSpeed)-1.0;
    float dist = abs(uv.x);
    vec3 baseColor = hsv2rgb(vec3(uHue/360.0, 0.7, 0.8));
    vec3 col = baseColor
      * pow(mix(0.0,0.07,hash11(iTime*uSpeed))/dist, 1.0)
      * uIntensity;
    fragColor = vec4(col, 1.0);
  }

  void main() { mainImage(gl_FragColor, gl_FragCoord.xy); }
`;

/**
 * @param {object}  props
 * @param {number}  [props.hue=230]
 * @param {number}  [props.xOffset=0]
 * @param {number}  [props.speed=1]
 * @param {number}  [props.intensity=1]
 * @param {number}  [props.size=1]
 * @param {string}  [props.className]
 */
export function Lightning({ hue=230, xOffset=0, speed=1, intensity=1, size=1, className='' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width  = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const compileShader = (src, type) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const vs = compileShader(LIGHTNING_VERTEX,   gl.VERTEX_SHADER);
    const fs = compileShader(LIGHTNING_FRAGMENT, gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const verts = new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]);
    const buf   = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes  = gl.getUniformLocation(program, 'iResolution');
    const uTime = gl.getUniformLocation(program, 'iTime');
    const uHue  = gl.getUniformLocation(program, 'uHue');
    const uOff  = gl.getUniformLocation(program, 'uXOffset');
    const uSpd  = gl.getUniformLocation(program, 'uSpeed');
    const uInt  = gl.getUniformLocation(program, 'uIntensity');
    const uSz   = gl.getUniformLocation(program, 'uSize');

    const start = performance.now();
    let frame;
    const render = () => {
      resize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes,  canvas.width, canvas.height);
      gl.uniform1f(uTime, (performance.now() - start) / 1000);
      gl.uniform1f(uHue,  hue);
      gl.uniform1f(uOff,  xOffset);
      gl.uniform1f(uSpd,  speed);
      gl.uniform1f(uInt,  intensity);
      gl.uniform1f(uSz,   size);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      frame = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [hue, xOffset, speed, intensity, size]);

  return (
    <canvas
      ref={canvasRef}
      className={['lightning-canvas', className].filter(Boolean).join(' ')}
    />
  );
}

/* ══════════════════════════════════════
   ElasticHueSlider
════════════════════════════════════════ */
/**
 * @param {object}   props
 * @param {number}   props.value
 * @param {Function} props.onChange
 * @param {number}   [props.min=0]
 * @param {number}   [props.max=360]
 * @param {number}   [props.step=1]
 * @param {string}   [props.label='Adjust Hue']
 */
export function ElasticHueSlider({ value, onChange, min=0, max=360, step=1, label='Adjust Hue' }) {
  const [isDragging, setIsDragging] = useState(false);
  const progress      = (value - min) / (max - min);
  const thumbPosition = progress * 100;

  return (
    <div className="elastic-slider">
      {label && <label className="elastic-slider__label">{label}</label>}
      <div className="elastic-slider__track-wrap">
        <input
          type="range"
          min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="elastic-slider__native"
        />
        <div className="elastic-slider__bg-track" />
        <div className="elastic-slider__fill" style={{ width: `${thumbPosition}%` }} />
        <motion.div
          className="elastic-slider__thumb"
          style={{ left: `${thumbPosition}%` }}
          animate={{ scale: isDragging ? 1.2 : 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: isDragging ? 20 : 30 }}
        />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          transition={{ duration: 0.2 }}
          className="elastic-slider__value"
        >
          {value}°
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════
   FeatureItem
════════════════════════════════════════ */
export function FeatureItem({ name, value, position }) {
  return (
    <div className={`feature-item ${position}`}>
      <div className="feature-item__inner">
        <div className="feature-item__dot-wrap">
          <div className="feature-item__dot" />
          <div className="feature-item__dot-glow" />
        </div>
        <div className="feature-item__text">
          <div className="feature-item__name">{name}</div>
          <div className="feature-item__value">{value}</div>
          <div className="feature-item__text-glow" />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   HeroOdyssey — full hero section
════════════════════════════════════════ */
export function HeroOdyssey() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lightningHue,    setLightningHue]   = useState(220);

  const containerVariants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.3, delayChildren: 0.2 } },
  };
  const itemVariants = {
    hidden:  { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <div className="hero-odyssey">
      {/* Content layer */}
      <div className="hero-odyssey__content">
        {/* Nav */}
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="hero-odyssey__nav"
        >
          <div className="hero-odyssey__nav-left">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
              <path d="M20 5L5 20L20 35L35 20L20 5Z" stroke="white" strokeWidth="2" />
            </svg>
            <div className="hero-odyssey__nav-links">
              {['Start','Home','Contacts','Help','Docs'].map(l => (
                <button key={l} className="hero-odyssey__nav-link">{l}</button>
              ))}
            </div>
          </div>
          <div className="hero-odyssey__nav-right">
            <button className="hero-odyssey__nav-link hero-odyssey__nav-link--hidden-mobile">Register</button>
            <button className="hero-odyssey__nav-btn">Application</button>
            <button
              className="hero-odyssey__hamburger"
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
          </div>
        </motion.nav>

        {/* Feature labels */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="hero-odyssey__features">
          <motion.div variants={itemVariants}><FeatureItem name="React"          value="for base"       position="hero-fi--1" /></motion.div>
          <motion.div variants={itemVariants}><FeatureItem name="Tailwind"        value="for styles"     position="hero-fi--2" /></motion.div>
          <motion.div variants={itemVariants}><FeatureItem name="Framer-motion"   value="for animations" position="hero-fi--3" /></motion.div>
          <motion.div variants={itemVariants}><FeatureItem name="WebGL Shaders"   value="for lightning"  position="hero-fi--4" /></motion.div>
        </motion.div>

        {/* Hero text */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="hero-odyssey__text-area">
          <ElasticHueSlider value={lightningHue} onChange={setLightningHue} label="Lightning Hue" />

          <motion.button variants={itemVariants} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hero-odyssey__pill-btn">
            <span>Join us for free world</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3L13 8L8 13M13 8H3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>

          <motion.h1 variants={itemVariants} className="hero-odyssey__title">Hero Odyssey</motion.h1>
          <motion.h2 variants={itemVariants} className="hero-odyssey__subtitle">Lighting Up The Future</motion.h2>
          <motion.p  variants={itemVariants} className="hero-odyssey__body">
            Lightning animation is 100% code generated — feel free to customise it.
          </motion.p>

          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hero-odyssey__cta-btn"
          >
            Discover Those Worlds
          </motion.button>
        </motion.div>
      </div>

      {/* Background */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="hero-odyssey__bg">
        <div className="hero-odyssey__bg-overlay" />
        <div className="hero-odyssey__bg-glow" />
        <div className="hero-odyssey__lightning-wrap">
          <Lightning hue={lightningHue} xOffset={0} speed={1.6} intensity={0.6} size={2} />
        </div>
        <div className="hero-odyssey__sphere" />
      </motion.div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="hero-odyssey__mobile-menu"
          >
            <button className="hero-odyssey__mobile-close" onClick={() => setMobileMenuOpen(false)}>✕</button>
            {['Start','Home','Contacts','Help','Docs','Register'].map(l => (
              <button key={l} className="hero-odyssey__mobile-link">{l}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default HeroOdyssey;
