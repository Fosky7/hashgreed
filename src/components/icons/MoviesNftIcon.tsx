import React from 'react';

export interface MoviesNftIconProps extends React.SVGProps<SVGSVGElement> {
  /** Pixel size for both width and height. Defaults to 24. */
  size?: number | string;
  /** Accessible label. When omitted the icon is treated as decorative (aria-hidden). */
  title?: string;
}

/**
 * MoviesNftIcon
 * A film clapperboard merged with an NFT hexagon badge, representing the
 * "Movies NFT" category. Strokes/fills use `currentColor` so the icon adopts
 * the surrounding text color (driven by semantic CSS variables).
 */
const MoviesNftIcon: React.FC<MoviesNftIconProps> = ({
  size = 24,
  title,
  className,
  ...rest
}) => {
  const decorative = !title;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
      focusable="false"
      className={className}
      {...rest}
    >
      {title ? <title>{title}</title> : null}

      {/* Clapperboard base body */}
      <rect
        x="3"
        y="12"
        width="26"
        height="15"
        rx="2.5"
        fill="currentColor"
        opacity="0.12"
        stroke="currentColor"
        strokeWidth="1.6"
      />

      {/* Clapperboard hinged top */}
      <path
        d="M3.6 12L6.4 6.4L11 7.7L8.2 13.3M11 7.7L15.6 9L12.8 14.6M15.6 9L20.2 10.3L17.4 15.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* NFT hexagon badge */}
      <path
        d="M24.5 17.5L27 19V22L24.5 23.5L22 22V19L24.5 17.5Z"
        fill="currentColor"
        opacity="0.25"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default MoviesNftIcon;
