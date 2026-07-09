import React from 'react';

interface PageHeadingProps {
  /** The heading text/content. */
  children: React.ReactNode;
  /** Optional supporting text rendered below the heading. */
  subtitle?: React.ReactNode;
  /** Heading element/level. Defaults to h1. */
  as?: 'h1' | 'h2';
  /** Additional classes for the wrapper. */
  className?: string;
}

/**
 * Reusable page/section heading enforcing a consistent type scale,
 * weight, tracking, and spacing across all pages.
 */
const PageHeading: React.FC<PageHeadingProps> = ({
  children,
  subtitle,
  as: Tag = 'h1',
  className = '',
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      <Tag className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl lg:text-4xl">
        {children}
      </Tag>
      {subtitle && (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default PageHeading;
