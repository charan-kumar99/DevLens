/**
 * TextScramble — Kinetic Typography Component
 *
 * Ported from the original Tailwind/TypeScript version to plain
 * JavaScript + CSS variables (DevLens Neural Obsidian system).
 *
 * Usage:
 *   <TextScramble text="VIEW WORK" />
 *   <TextScramble text="ANALYZE REPO" variant="ai" size="lg" />
 *   <TextScramble text="COMPARE" noUnderline />
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import './TextScramble.css';

// Character pool used during scramble frames
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';

/**
 * @param {object}  props
 * @param {string}  props.text         — The real text to display / reveal
 * @param {string}  [props.className]  — Extra class names for root element
 * @param {'sm'|'lg'|'xl'} [props.size]     — Size modifier
 * @param {'ai'|'accent'|'muted'} [props.variant] — Color variant
 * @param {boolean} [props.noUnderline]  — Hides the animated underline
 * @param {() => void} [props.onClick]  — Click handler (optional)
 */
export function TextScramble({
  text,
  className = '',
  size,
  variant,
  noUnderline = false,
  onClick,
}) {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering]   = useState(false);
  const [isScrambling, setIsScrambling] = useState(false);

  const intervalRef = useRef(null);
  const frameRef    = useRef(0);

  // If `text` prop changes from outside, reset displayed text
  useEffect(() => {
    setDisplayText(text);
  }, [text]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const scramble = useCallback(() => {
    setIsScrambling(true);
    frameRef.current = 0;

    // Total frames = 3 per character  →  longer text = longer animation
    const duration = text.length * 3;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      frameRef.current += 1;

      const progress      = frameRef.current / duration;
      const revealedCount = Math.floor(progress * text.length);

      const next = text
        .split('')
        .map((char, i) => {
          if (char === ' ') return ' ';           // preserve spaces as-is
          if (i < revealedCount) return text[i];  // already revealed
          return CHARS[Math.floor(Math.random() * CHARS.length)]; // scramble
        })
        .join('');

      setDisplayText(next);

      if (frameRef.current >= duration) {
        clearInterval(intervalRef.current);
        setDisplayText(text); // lock to final value
        setIsScrambling(false);
      }
    }, 30); // ~33 fps feels snappy without being jarring
  }, [text]);

  const handleMouseEnter = () => {
    setIsHovering(true);
    scramble();
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    // Don't cancel mid-animation — let it finish revealing naturally
  };

  // Build root class list
  const rootClasses = [
    'text-scramble',
    size         && `text-scramble--${size}`,
    variant      && `text-scramble--${variant}`,
    noUnderline  && 'text-scramble--no-underline',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={rootClasses}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      aria-label={text}  // screen readers always see the real text
    >
      {/* Background glow */}
      <span className="text-scramble__glow" aria-hidden="true" />

      {/* Character row */}
      <span className="text-scramble__text" aria-hidden="true">
        {displayText.split('').map((char, i) => {
          const isScrambled = isScrambling && char !== text[i] && char !== ' ';
          return (
            <span
              key={i}
              className={`text-scramble__char ${
                isScrambled
                  ? 'text-scramble__char--scrambling'
                  : 'text-scramble__char--normal'
              }`}
              style={{ transitionDelay: `${i * 10}ms` }}
            >
              {char === ' ' ? '\u00a0' : char}  {/* nbsp preserves space */}
            </span>
          );
        })}
      </span>

      {/* Animated underline */}
      {!noUnderline && (
        <span className="text-scramble__underline" aria-hidden="true">
          <span className="text-scramble__underline-fill" />
          <span className="text-scramble__underline-base" />
        </span>
      )}
    </div>
  );
}

export default TextScramble;
