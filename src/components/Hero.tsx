import React from 'react';
import { Link } from 'react-router-dom';

export interface HeroCTA {
  /** Visible button label */
  label: string;
  /** React Router path the CTA navigates to */
  to: string;
  /** Visual emphasis: primary (filled) or secondary (outlined) */
  variant?: 'primary' | 'secondary';
}

export interface HeroTrustSignal {
  /** Decorative emoji / glyph shown before the label */
  icon: string;
  /** Short trust statement */
  label: string;
}

export interface HeroProps {
  /** Small pill text above the headline */
  badge?: string;
  /** Main headline. Can include markup via heading prop fallback */
  title?: React.ReactNode;
  /** Supporting paragraph beneath the headline */
  subtitle?: string;
  /** Short trust/social-proof statements */
  trustSignals?: HeroTrustSignal[];
  /** Call-to-action buttons (primary + secondary recommended) */
  ctas?: HeroCTA[];
  /** Background image URL */
  imageUrl?: string;
  /** Accessible description of the background image */
  imageAlt?: string;
}

const DEFAULT_IMAGE = 'https://gtbwpdlebllwrfzgvwfl.supabase.co/storage/v1/object/public/project-assets/5f928b6f-e98b-4b5f-a7ea-25e0082af39e/assets/home-hero-marketplace.png';

const DEFAULT_CTAS: HeroCTA[] = [
  { label: 'Explore Marketplace', to: '/explore', variant: 'primary' },
  { label: 'Create Your NFT', to: '/create', variant: 'secondary' },
];

const DEFAULT_TRUST: HeroTrustSignal[] = [
  { icon: '✅', label: 'Secured on Kross Blockchain' },
  { icon: '⚡', label: 'Instant, low-fee transactions' },
  { icon: '🎨', label: 'Earn royalties on resales' },
];

/**
 * Hero
 * The primary above-the-fold marketing section for the Hashgreed marketplace.
 * Fully configurable via props with marketplace-appropriate defaults.
 */
const HERO_FALLBACK_GRADIENT =
  'linear-gradient(135deg, hsl(252 80% 30%), hsl(280 70% 24%) 55%, hsl(210 70% 22%))';

const Hero: React.FC<HeroProps> = ({
  badge = '🚀 Powered by the Kross Blockchain',
  title = (
    <>
      Discover, Collect &amp; Create Digital Art NFTs
    </>
  ),
  subtitle = 'Hashgreed is the premier marketplace for unique digital collectibles. Explore exclusive NFTs, mint your own creations and trade in KSS.',
  trustSignals = DEFAULT_TRUST,
  ctas = DEFAULT_CTAS,
  imageUrl = DEFAULT_IMAGE,
  imageAlt = 'Vibrant gallery of glowing digital art NFTs floating in a neon-lit Kross Blockchain marketplace',
}) => {
  const [imageFailed, setImageFailed] = React.useState(false);

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative rounded-3xl overflow-hidden shadow-xl border border-[var(--border-color)] mb-12 flex min-h-[26rem] md:min-h-[30rem] lg:min-h-[34rem]"
      style={imageFailed ? { backgroundImage: HERO_FALLBACK_GRADIENT } : undefined}
    >
      {/* Background image with graceful fallback. When it fails we keep the
          section height via the gradient background above so the layout never
          collapses into an empty strip. */}
      {!imageFailed && (
        <img
          src={imageUrl}
          alt={imageAlt}
          className="absolute inset-0 w-full h-full object-cover object-center bg-[var(--hover-bg)] scale-105"
          style={{ objectPosition: 'center 35%' }}
          loading="eager"
          onError={() => setImageFailed(true)}
        />
      )}

      {/* Readability gradient overlay — strong on the left where the copy sits,
          fading to the right, so white text stays legible over any image. */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/25"
        aria-hidden="true"
      />
      {/* Bottom vignette for extra legibility of the CTAs on tall images. */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent"
        aria-hidden="true"
      />

      {/* Content — flows naturally with padding so it is never clipped on small screens. */}
      <div className="relative z-10 flex flex-col justify-center w-full max-w-3xl px-6 py-10 sm:py-12 md:px-12 lg:px-16">
        {badge ? (
          <span className="inline-flex items-center gap-2 self-start mb-4 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-white text-xs md:text-sm font-semibold tracking-wide">
            {badge}
          </span>
        ) : null}

        <h1
          id="hero-heading"
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-5 leading-tight drop-shadow-2xl"
        >
          {title}
        </h1>

        {subtitle ? (
          <p className="text-base md:text-xl text-white/85 mb-8 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        ) : null}

        {trustSignals && trustSignals.length > 0 ? (
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-8 text-white/80 text-sm list-none p-0 m-0">
            {trustSignals.map((signal) => (
              <li key={signal.label} className="inline-flex items-center gap-2">
                <span aria-hidden="true">{signal.icon}</span>
                {signal.label}
              </li>
            ))}
          </ul>
        ) : null}

        {ctas && ctas.length > 0 ? (
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {ctas.map((cta) => {
              const isPrimary = (cta.variant ?? 'primary') === 'primary';
              return (
                <Link key={cta.label} to={cta.to} className="w-full sm:w-auto">
                  <button
                    type="button"
                    className={
                      isPrimary
                        ? 'w-full sm:w-auto px-8 py-4 rounded-full bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover-bg)] transition-all duration-300 ease-in-out shadow-lg text-lg font-semibold transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60'
                        : 'w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 backdrop-blur border-2 border-white text-white hover:bg-white/20 transition-all duration-300 ease-in-out shadow-lg text-lg font-semibold transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60'
                    }
                  >
                    {cta.label}
                  </button>
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default Hero;
