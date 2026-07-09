import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
  id?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  actionHref,
  className = '',
  id,
}) => {
  return (
    <div className={`mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-primary-700">
            {eyebrow}
          </p>
        )}
        <h2 id={id} className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl lg:text-4xl">
          {title}
        </h2>
        {subtitle && <p className="mt-3 text-sm leading-6 text-gray-600 sm:text-base">{subtitle}</p>}
      </div>

      {actionLabel && actionHref && (
        <Link
          to={actionHref}
          className="inline-flex w-fit items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary-700 shadow-sm ring-1 ring-gray-200 transition hover:bg-primary-50 hover:ring-primary-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          {actionLabel}
          <ArrowRightIcon className="ml-2 h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
};

export default SectionHeader;
