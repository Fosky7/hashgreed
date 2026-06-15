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
      <path
        d="M3.6 12L28.4 12L29 10.2C29.2 9.4 28.7 8.6 27.9 8.4L8.9 4.3C8.1 4.1 7.3 4.6 7.1 5.4L6.4 6.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Play triangle on the board */}
      <path
        d="M13.5 16.8L20 20L13.5 23.2V16.8Z"
        fill="currentColor"
        opacity="0.85"
      />

      {/* NFT hexagon badge */}
      <path
        d="M25.5 18.2L28.6 20V23.6L25.5 25.4L22.4 23.6V20L25.5 18.2Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <text
        x="25.5"
        y="23"
        textAnchor="middle"
        fontSize="3.4"
        fontWeight="700"
        fill="var(--card-bg, #ffffff)"
        fontFamily="system-ui, sans-serif"
      >
        N
      </text>
    </svg>
  );
};

export default MoviesNftIcon;
