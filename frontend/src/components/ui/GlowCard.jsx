/**
 * GlowCard (spotlight-card)
 *
 * A card with a cursor-tracked radial glow spotlight on its border.
 * Adapted from TypeScript/Tailwind to plain JS + CSS.
 *
 * Removals: TypeScript interfaces, React.FC type, Tailwind utilities
 *           (sizeMap Tailwind classes → CSS classes), cn() → join
 * Addition: ./GlowCard.css replacing all Tailwind layout classes.
 *
 * Dependencies: none (vanilla DOM pointerEvent tracking)
 *
 * Usage:
 *   import { GlowCard } from '../components/ui/GlowCard';
 *
 *   <GlowCard glowColor="blue">
 *     <p>Card content</p>
 *   </GlowCard>
 *
 *   <GlowCard glowColor="purple" size="lg" className="my-class">
 *     <img ... />
 *   </GlowCard>
 */

import { useEffect, useRef, useState } from 'react';
import './GlowCard.css';

const GLOW_COLOR_MAP = {
  blue:   { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green:  { base: 120, spread: 200 },
  red:    { base:   0, spread: 200 },
  orange: { base:  30, spread: 200 },
};

/**
 * @param {object}        props
 * @param {React.ReactNode} [props.children]
 * @param {string}        [props.className]     — extra class names
 * @param {'blue'|'purple'|'green'|'red'|'orange'} [props.glowColor='blue']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {string|number} [props.width]         — override width
 * @param {string|number} [props.height]        — override height
 * @param {boolean}       [props.customSize]    — ignore size, use className/width/height
 */
export function GlowCard({
  children,
  className = '',
  glowColor = 'blue',
  size = 'md',
  width,
  height,
  customSize = false,
}) {
  const cardRef = useRef(null);
  
  // Dynamic color state that updates on hover
  const [activeColor, setActiveColor] = useState(glowColor);

  // Available colors to pick from
  const availableColors = Object.keys(GLOW_COLOR_MAP);

  /* Track pointer position across the whole document so the glow
     follows the cursor even when approaching from outside the card. */
  useEffect(() => {
    const syncPointer = (e) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      // Calculate local mouse position relative to the element itself
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      cardRef.current.style.setProperty('--x',  x.toFixed(2));
      cardRef.current.style.setProperty('--xp', (e.clientX / window.innerWidth).toFixed(2));
      cardRef.current.style.setProperty('--y',  y.toFixed(2));
      cardRef.current.style.setProperty('--yp', (e.clientY / window.innerHeight).toFixed(2));
    };
    document.addEventListener('pointermove', syncPointer);
    return () => document.removeEventListener('pointermove', syncPointer);
  }, []);

  const { base, spread } = GLOW_COLOR_MAP[activeColor] ?? GLOW_COLOR_MAP.blue;

  /* Inline CSS custom-property styles drive the spotlight shader logic */
  const inlineStyles = {
    '--base':   base,
    '--spread': spread,
    '--radius': '14',
    '--border': '3',
    '--backdrop':       'hsl(0 0% 60% / 0.12)',
    '--backup-border':  'var(--backdrop)',
    '--size':   '200',
    '--outer':  '1',
    '--border-size':    'calc(var(--border, 2) * 1px)',
    '--spotlight-size': 'calc(var(--size, 150) * 1px)',
    '--hue': 'calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))',
    backgroundImage: `radial-gradient(
      var(--spotlight-size) var(--spotlight-size)
      at calc(var(--x, 0) * 1px) calc(var(--y, 0) * 1px),
      hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 70) * 1%) / var(--bg-spot-opacity, 0.1)),
      transparent
    )`,
    backgroundColor:   'var(--backdrop, transparent)',
    backgroundSize:    'calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))',
    backgroundPosition:'50% 50%',
    border:    'var(--border-size) solid var(--backup-border)',
    position:  'relative',
    touchAction: 'none',
    ...(width  !== undefined ? { width:  typeof width  === 'number' ? `${width}px`  : width  } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
  };

  const sizeClass = customSize ? '' : `glow-card--${size}`;

  return (
    <>
      {/* Inject ::before / ::after pseudo-element styles once */}
      <style>{GLOW_PSEUDO_STYLES}</style>

      <div
        ref={cardRef}
        data-glow
        style={inlineStyles}
        className={['glow-card', sizeClass, className].filter(Boolean).join(' ')}
        onPointerEnter={() => {
          // Pick a random color from the available list that isn't the current one
          let nextColor = activeColor;
          while (nextColor === activeColor) {
            nextColor = availableColors[Math.floor(Math.random() * availableColors.length)];
          }
          setActiveColor(nextColor);
        }}
      >
        {/* Inner "outer glow" node */}
        <div data-glow className="glow-card__inner" />
        {children}
      </div>
    </>
  );
}

/* Pseudo-element styles for the glow border effect.
   These MUST use [data-glow] selectors and fixed background-attachment
   to track the global cursor position via CSS custom properties. */
const GLOW_PSEUDO_STYLES = `
  [data-glow]::before,
  [data-glow]::after {
    pointer-events: none;
    content: "";
    position: absolute;
    inset: calc(var(--border-size) * -1);
    border: var(--border-size) solid transparent;
    border-radius: calc(var(--radius) * 1px);
    background-size:
      calc(100% + (2 * var(--border-size)))
      calc(100% + (2 * var(--border-size)));
    background-repeat: no-repeat;
    background-position: 50% 50%;
    -webkit-mask:
      linear-gradient(transparent, transparent),
      linear-gradient(white, white);
    -webkit-mask-clip: padding-box, border-box;
    -webkit-mask-composite: source-in;
    
    mask:
      linear-gradient(transparent, transparent),
      linear-gradient(white, white);
    mask-clip: padding-box, border-box;
    mask-composite: intersect;
  }

  [data-glow]::before {
    background-image: radial-gradient(
      calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75)
      at calc(var(--x, 0) * 1px) calc(var(--y, 0) * 1px),
      hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 50) * 1%) / var(--border-spot-opacity, 1)),
      transparent 100%
    );
    filter: brightness(2);
  }

  [data-glow]::after {
    background-image: radial-gradient(
      calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5)
      at calc(var(--x, 0) * 1px) calc(var(--y, 0) * 1px),
      hsl(0 100% 100% / var(--border-light-opacity, 1)),
      transparent 100%
    );
  }

  [data-glow] [data-glow] {
    position: absolute;
    inset: 0;
    will-change: filter;
    opacity: var(--outer, 1);
    border-radius: calc(var(--radius) * 1px);
    border-width: calc(var(--border-size) * 20);
    filter: blur(calc(var(--border-size) * 10));
    background: none;
    pointer-events: none;
    border: none;
  }

  [data-glow] > [data-glow]::before {
    inset: -10px;
    border-width: 10px;
  }
`;

export default GlowCard;
