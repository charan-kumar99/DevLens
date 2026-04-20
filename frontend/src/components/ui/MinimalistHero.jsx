/**
 * MinimalistHero
 *
 * A clean, centred hero layout with:
 *   - top nav (logo + links + hamburger)
 *   - centre image on a coloured circle
 *   - overlay headline text
 *   - social links + location footer
 *
 * Adapted from TypeScript/Tailwind → plain JS + CSS.
 * Removals: LucideIcon type, cn() (replaced with array join),
 *   TypeScript interfaces, Tailwind classes → MinimalistHero.css
 * Dependencies: framer-motion (installed), lucide-react (installed)
 *
 * Usage:
 *   import { MinimalistHero } from '../components/ui/MinimalistHero';
 *   <MinimalistHero {...props} />
 */

import { motion } from 'framer-motion';
import './MinimalistHero.css';

/* ── Helper: nav link ── */
function NavLink({ href, children }) {
  return (
    <a href={href} className="mh-nav-link">
      {children}
    </a>
  );
}

/* ── Helper: social icon ── */
function SocialIcon({ href, icon: Icon }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="mh-social-icon">
      <Icon size={20} />
    </a>
  );
}

/**
 * @param {object}   props
 * @param {string}   props.logoText
 * @param {{label:string, href:string}[]}  props.navLinks
 * @param {string}   props.mainText
 * @param {string}   props.readMoreLink
 * @param {string}   props.imageSrc
 * @param {string}   props.imageAlt
 * @param {{part1:string, part2:string}}   props.overlayText
 * @param {{icon:Function, href:string}[]} props.socialLinks
 * @param {string}   props.locationText
 * @param {string}   [props.className]
 */
export function MinimalistHero({
  logoText,
  navLinks       = [],
  mainText,
  readMoreLink   = '#',
  imageSrc,
  imageAlt,
  overlayText    = { part1: 'less is', part2: 'more.' },
  socialLinks    = [],
  locationText,
  className      = '',
}) {
  return (
    <div className={['mh-root', className].filter(Boolean).join(' ')}>
      {/* Header */}
      <header className="mh-header">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mh-logo"
        >
          {logoText}
        </motion.div>

        <nav className="mh-nav">
          {navLinks.map((l) => (
            <NavLink key={l.label} href={l.href}>{l.label}</NavLink>
          ))}
        </nav>

        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mh-hamburger"
          aria-label="Open menu"
        >
          <span /><span /><span />
        </motion.button>
      </header>

      {/* Main grid */}
      <div className="mh-grid">
        {/* Left copy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mh-copy"
        >
          <p className="mh-body">{mainText}</p>
          <a href={readMoreLink} className="mh-read-more">Read More</a>
        </motion.div>

        {/* Centre image */}
        <div className="mh-image-wrap">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="mh-circle"
          />
          <motion.img
            src={imageSrc}
            alt={imageAlt}
            className="mh-image"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/400x600/eab308/ffffff?text=Image';
            }}
          />
        </div>

        {/* Right headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mh-headline-wrap"
        >
          <h1 className="mh-headline">
            {overlayText.part1}
            <br />
            {overlayText.part2}
          </h1>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="mh-footer">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          className="mh-socials"
        >
          {socialLinks.map((l, i) => (
            <SocialIcon key={i} href={l.href} icon={l.icon} />
          ))}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.3 }}
          className="mh-location"
        >
          {locationText}
        </motion.div>
      </footer>
    </div>
  );
}

export default MinimalistHero;
