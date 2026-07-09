import React from 'react';
import {
  ArrowRightIcon,
  ClockIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import SearchBar from './SearchBar';

interface HeroBannerProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  onPrimaryCtaClick?: () => void;
  onSecondaryCtaClick?: () => void;
}

const HeroBanner: React.FC<HeroBannerProps> = ({
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
  onPrimaryCtaClick,
  onSecondaryCtaClick,
}) => {
  const highlights = [
    { label: 'Avg. 30 min delivery', icon: ClockIcon },
    { label: 'Verified local kitchens', icon: ShieldCheckIcon },
    { label: 'Fresh Nigerian favourites', icon: SparklesIcon },
  ];

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.18),_transparent_34%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_46%,_#f8fafc_100%)]">
      <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-primary-200/40 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 left-1/4 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" aria-hidden="true" />

      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.02fr_0.98fr] lg:py-20">
        <div className="relative z-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-primary-700 shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-primary-500" aria-hidden="true" />
            Premium African food delivery
          </div>

          <h1 className="max-w-4xl text-4xl font-black tracking-tight text-gray-950 sm:text-5xl lg:text-6xl xl:text-7xl">
            Authentic local meals, delivered with world-class speed.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-gray-650 sm:text-lg">
            Discover Jollof, Suya, Swallows, Pepper Soup and everyday favourites from trusted kitchens around you — hot, fresh and right on time.
          </p>

          <div className="mt-8 max-w-2xl rounded-[1.65rem] border border-white/80 bg-white/70 p-2 shadow-soft backdrop-blur-xl">
            <SearchBar
              value={searchValue}
              onChange={onSearchChange ?? (() => undefined)}
              onSubmit={onSearchSubmit}
              placeholder="Search Jollof, Suya, Pepper Soup..."
              ariaLabel="Search restaurants and cuisines"
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onPrimaryCtaClick}
              className="inline-flex items-center justify-center rounded-full bg-primary-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-600/25 transition hover:-translate-y-0.5 hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              Explore restaurants
              <ArrowRightIcon className="ml-2 h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onSecondaryCtaClick}
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-bold text-gray-800 shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-0.5 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              View popular meals
            </button>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-white/80 backdrop-blur">
                  <Icon className="h-5 w-5 text-primary-600" aria-hidden="true" />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-lg lg:max-w-none">
          <div className="relative aspect-square overflow-hidden rounded-[2.25rem] border border-white/80 bg-gray-950 shadow-2xl shadow-primary-900/20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(251,146,60,0.95),_transparent_26%),radial-gradient(circle_at_80%_20%,_rgba(234,88,12,0.75),_transparent_26%),linear-gradient(135deg,_#111827,_#431407)]" />
            <div className="absolute left-8 top-8 rounded-3xl bg-white/95 p-5 shadow-xl backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Now serving</p>
              <p className="mt-1 text-2xl font-black text-gray-950">Lagos Lunch</p>
              <p className="mt-1 text-sm font-medium text-gray-500">15–30 mins</p>
            </div>
            <div className="absolute bottom-8 right-6 w-52 rounded-3xl bg-white/95 p-4 shadow-xl backdrop-blur sm:right-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                  <MapPinIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-950">Track live</p>
                  <p className="text-xs text-gray-500">Rider arriving soon</p>
                </div>
              </div>
            </div>
            <div className="absolute left-1/2 top-1/2 grid h-64 w-64 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/10 ring-1 ring-white/25">
              <div className="grid h-48 w-48 place-items-center rounded-full bg-white/15 text-8xl shadow-inner" aria-hidden="true">
                🍲
              </div>
            </div>
            <div className="absolute right-10 top-24 rotate-6 rounded-2xl bg-white/90 px-4 py-2 text-sm font-black text-gray-950 shadow-lg">
              4.8 ★ rated
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
