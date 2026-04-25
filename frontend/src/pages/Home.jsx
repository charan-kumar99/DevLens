import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { analyzeRepo } from '../utils/api';
import { SkeletonCard, SkeletonChart } from '../components/SkeletonLoader';
import Footer from '../components/Footer';
import { TextScramble } from '../components/ui/TextScramble';
import { SparklesCore } from '../components/ui/SparklesCore';
import { GlowCard } from '../components/ui/GlowCard';
import { AnimatedShaderBackground } from '../components/ui/AnimatedShaderBackground';
import { Component as VaporizeTextCycle } from '../components/ui/VapourTextEffect';
import { LightningEffect } from '../components/ui/LightningEffect';
import { motion, useScroll, useTransform, useMotionValue } from 'framer-motion';
import './Home.css';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const scrollContainerRef = useRef(null);
  const thumb2Ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: scrollContainerRef,
    offset: ['start start', 'end end']
  });

  // ── Motion values for thumb2 offset ──
  const thumb2TargetX = useMotionValue(0);
  const thumb2TargetY = useMotionValue(0);

  useEffect(() => {
    const measure = () => {
      if (!thumb2Ref.current) return;
      const rect = thumb2Ref.current.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top  + rect.height / 2;
      const vwCenter = window.innerWidth  / 2;
      const vhCenter = window.innerHeight / 2;
      thumb2TargetX.set(vwCenter - cardCenterX);
      thumb2TargetY.set(vhCenter - cardCenterY);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [thumb2TargetX, thumb2TargetY]);

  // ══════════════════════════════════════════════════════
  // HERO — the ENTIRE section fades from 0% to 50% scroll.
  // Fades out slowly as the card zooms to full size.
  // ══════════════════════════════════════════════════════
  const heroSectionOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroSectionPointer = useTransform(scrollYProgress, v => v > 0.4 ? 'none' : 'auto');
  const heroSectionDisplay = useTransform(scrollYProgress, v => v > 0.5 ? 'none' : 'flex');
  const heroTextY          = useTransform(scrollYProgress, [0, 0.5], [0, -40]);

  // Thumb 2 zoom (stays visible, doesn't fade)
  const thumb2ScaleX  = useTransform(scrollYProgress, [0, 0.5], [1, 2.71]);
  const thumb2ScaleY  = useTransform(scrollYProgress, [0, 0.5], [1, 5.14]);
  const thumb2ZoomOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 1]); // stays at 1
  const thumb2Progress = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const thumb2X = useTransform(
    [thumb2Progress, thumb2TargetX],
    ([p, tx]) => p * tx
  );
  const thumb2Y = useTransform(
    [thumb2Progress, thumb2TargetY],
    ([p, ty]) => p * ty
  );

  // Thumbs 1 & 3 fade from 0% to 50%
  const thumb1Opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const thumb3Opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // ══════════════════════════════════════════════════════
  // GALLERY — starts AFTER hero is fully gone (38%+)
  // LEFT  = Card 03 — Visual Metrics   (slides from left)
  // CENTER = Card 01 — AI Code Analysis (fades in, tallest)
  // RIGHT  = Card 02 — Instant Insights (slides from right)
  // ══════════════════════════════════════════════════════
  const cardCenterOpacity = useTransform(scrollYProgress, [0.38, 0.72], [0, 1]);
  const card2Opacity      = useTransform(scrollYProgress, [0.42, 0.78], [0, 1]);
  const card2X            = useTransform(scrollYProgress, [0.42, 0.78], [200, 0]);
  const card3Opacity      = useTransform(scrollYProgress, [0.42, 0.78], [0, 1]);
  const card3X            = useTransform(scrollYProgress, [0.42, 0.78], [-200, 0]);

  useEffect(() => {
    if (location.state?.url) setUrl(location.state.url);
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const trimmed = url.trim();
    if (!trimmed) { setError('Please enter a GitHub repository URL.'); return; }
    setLoading(true);
    try {
      const result = await analyzeRepo(trimmed);
      navigate('/dashboard', { state: { result } });
    } catch (err) {
      setError(err.message || 'Analysis failed. Check the URL and try again.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="home-loading">
        <div className="home-loading__header">
          <div className="home-loading__icon">
            <div className="home-loading__spinner" aria-hidden="true" />
          </div>
          <h2 className="home-loading__title">Analyzing Repository</h2>
          {url && <p className="home-loading__repo">{url.replace('https://github.com/', '')}</p>}
          <p className="home-loading__subtitle">AI is examining your codebase — this takes a few moments</p>
          <div className="home-loading__progress" role="progressbar" aria-label="Analysis progress">
            <div className="home-loading__progress-bar" />
          </div>
        </div>
        <div className="home-loading__content">
          <div className="home-loading__grid">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
          <SkeletonChart /><SkeletonChart />
        </div>
      </div>
    );
  }

  return (
    <div className="home">
      {/* ── Fixed atmospheric layers ── */}
      <div className="home__bg" aria-hidden="true" />
      <div className="home__mesh" aria-hidden="true"><AnimatedShaderBackground /></div>
      <div className="home__lightning" aria-hidden="true">
        <LightningEffect hue={230} speed={1.6} intensity={0.3} size={1.2} />
      </div>
      <div className="home__sparkles" aria-hidden="true">
        <SparklesCore
          background="transparent" minSize={0.4} maxSize={1.2}
          particleDensity={70} particleColor="#4f9eff" speed={1.5}
        />
      </div>

      <div ref={scrollContainerRef} className="home__scroll-outer">
        <div className="home__scroll-sticky">

          {/* ══════════════════════════════════════════════════════
              HERO — entire block wrapped in ONE motion.div fade.
              opacity goes 1 → 0 between 0% and 30% scroll.
              pointerEvents becomes 'none' at 20% so clicks don't
              get swallowed by the invisible hero after it fades.
          ══════════════════════════════════════════════════════ */}
          <motion.div
            className="home__hero-fade-wrapper"
            style={{
              opacity: heroSectionOpacity,
              pointerEvents: heroSectionPointer,
              display: heroSectionDisplay,
            }}
          >
            <main className="home__main">
              <div className="home__content">

                <motion.div style={{ y: heroTextY }}>

                  {/* Gemini AI Badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="home__badge" aria-label="Powered by Google Gemini AI"
                  >
                    <span className="home__badge-dot" aria-hidden="true" />
                    Powered by Google Gemini AI
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="home__header"
                  >
                    <VaporizeTextCycle />
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="home__subtitle"
                  >
                    DevLens uses AI to analyze code quality, activity trends, contributor patterns,
                    and generate instant insights — so you can make smarter decisions faster.
                  </motion.p>

                  <motion.form
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="home__form" onSubmit={handleSubmit} noValidate
                  >
                    <div className="home__input-wrap">
                      <input
                        type="url" className="home__input"
                        placeholder="https://github.com/owner/repo"
                        value={url} onChange={(e) => setUrl(e.target.value)}
                        disabled={loading} autoFocus
                        aria-label="GitHub repository URL" id="repo-url-input"
                        spellCheck="false" autoCorrect="off" autoCapitalize="off"
                      />
                    </div>
                    <button type="submit" className="home__btn" disabled={loading}
                      id="analyze-btn" aria-label="Analyze repository">
                      <TextScramble text="ANALYZE REPOSITORY →" size="md" noUnderline />
                    </button>
                  </motion.form>

                  {error && (
                    <div className="home__error" role="alert" id="error-message">{error}</div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.0 }}
                    className="home__feature-pills" aria-label="Key features"
                  >
                    <span className="home__pill">🔬 AI Code Analysis</span>
                    <span className="home__pill">⚡ Instant Insights</span>
                    <span className="home__pill">📊 Visual Metrics</span>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.1 }}
                    className="home__link"
                  >
                    Try:{' '}
                    <a href="#" onClick={(e) => { e.preventDefault(); setUrl('https://github.com/facebook/react'); setError(null); }}
                      aria-label="Try facebook/react repository">facebook/react</a>
                    {' · '}
                    <a href="#" onClick={(e) => { e.preventDefault(); setUrl('https://github.com/vercel/next.js'); setError(null); }}
                      aria-label="Try vercel/next.js repository">vercel/next.js</a>
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                    className="home__actions"
                  >
                    <Link to="/compare" className="home__link-action home__link-action--scramble"
                      id="compare-link" aria-label="Go to Compare Repos">
                      <TextScramble text="COMPARE REPOS" size="sm" noUnderline />
                    </Link>
                    <span className="action-divider" aria-hidden="true">|</span>
                    <Link to="/discover" className="home__link-action home__link-action--scramble"
                      id="discover-link" aria-label="Go to Discover Trending">
                      <TextScramble text="DISCOVER REPOS" size="sm" variant="ai" noUnderline />
                    </Link>
                  </motion.div>

                </motion.div>

                {/* ── 3 thumbnail cards ── */}
                <div className="home__hero-thumbs">
                  <motion.div
                    className="home__card-thumb"
                    style={{ opacity: thumb1Opacity }}
                  >
                    <span className="home__card-thumb-icon">🔬</span>
                    <span className="home__card-thumb-num">01</span>
                    <span className="home__card-thumb-title">AI Code Analysis</span>
                  </motion.div>

                  <motion.div
                    ref={thumb2Ref}
                    className="home__card-thumb home__card-thumb--hero"
                    style={{
                      opacity: thumb2ZoomOpacity,
                      scaleX: thumb2ScaleX, scaleY: thumb2ScaleY,
                      x: thumb2X, y: thumb2Y,
                      transformOrigin: 'center center',
                      zIndex: 20, position: 'relative',
                    }}
                  >
                    <span className="home__card-thumb-icon">⚡</span>
                    <span className="home__card-thumb-num">02</span>
                    <span className="home__card-thumb-title">Instant Insights</span>
                  </motion.div>

                  <motion.div className="home__card-thumb" style={{ opacity: thumb3Opacity }}>
                    <span className="home__card-thumb-icon">📊</span>
                    <span className="home__card-thumb-num">03</span>
                    <span className="home__card-thumb-title">Visual Metrics</span>
                  </motion.div>
                </div>

              </div>
            </main>
          </motion.div>
          {/* ── END HERO ── */}

          {/* ══════════════════════════════════════════════════════
              3-PANEL GALLERY
              Starts appearing at 38% — hero is fully gone by 30%.
              Clean 8% gap ensures zero overlap.
          ══════════════════════════════════════════════════════ */}
          <div className="home__gallery-wrap">

            {/* LEFT — Card 03: Visual Metrics */}
            <motion.div
              className="home__gallery-side-card home__gallery-side-card--left"
              style={{ opacity: card3Opacity, x: card3X, pointerEvents: 'auto' }}
            >
              <GlowCard glowColor="green" customSize className="home__sidecard">
                <div className="home__vcard-body">
                  <span className="home__vcard-num">03</span>
                  <span className="home__vcard-icon">📊</span>
                  <strong className="home__vcard-title">Visual Metrics</strong>
                  <p className="home__vcard-desc">Interactive charts and graphs turn raw data into actionable stories.</p>
                  <ul className="home__vcard-list">
                    <li className="home__vcard-list-item"><span className="home__vcard-check">✦</span>Code health timelines</li>
                    <li className="home__vcard-list-item"><span className="home__vcard-check">✦</span>Dependency graphs</li>
                  </ul>
                  <span className="home__vcard-tag">Powered by Gemini</span>
                </div>
              </GlowCard>
            </motion.div>

            {/* CENTER — Card 01: AI Code Analysis (tallest) */}
            <motion.div
              className="home__gallery-center-card"
              style={{ opacity: cardCenterOpacity, pointerEvents: 'auto' }}
            >
              <GlowCard glowColor="blue" customSize className="home__sidecard">
                <div className="home__vcard-body">
                  <span className="home__vcard-num">01</span>
                  <span className="home__vcard-icon">🔬</span>
                  <strong className="home__vcard-title">AI Code Analysis</strong>
                  <p className="home__vcard-desc">Deep neural scanning of your architecture to find structural anti-patterns.</p>
                  <ul className="home__vcard-list">
                    <li className="home__vcard-list-item"><span className="home__vcard-check">✦</span>Security audits</li>
                    <li className="home__vcard-list-item"><span className="home__vcard-check">✦</span>Performance insights</li>
                  </ul>
                  <span className="home__vcard-tag">Powered by Gemini</span>
                </div>
              </GlowCard>
            </motion.div>

            {/* RIGHT — Card 02: Instant Insights */}
            <motion.div
              className="home__gallery-side-card home__gallery-side-card--right"
              style={{ opacity: card2Opacity, x: card2X, pointerEvents: 'auto' }}
            >
              <GlowCard glowColor="purple" customSize className="home__sidecard">
                <div className="home__vcard-body">
                  <span className="home__vcard-num">02</span>
                  <span className="home__vcard-icon">⚡</span>
                  <strong className="home__vcard-title">Instant Insights</strong>
                  <p className="home__vcard-desc">Get real-time metrics and visual dashboards that surface codebase health.</p>
                  <ul className="home__vcard-list">
                    <li className="home__vcard-list-item"><span className="home__vcard-check">✦</span>Live activity trends</li>
                    <li className="home__vcard-list-item"><span className="home__vcard-check">✦</span>Contributor heatmaps</li>
                  </ul>
                  <span className="home__vcard-tag">Powered by Gemini</span>
                </div>
              </GlowCard>
            </motion.div>

          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}