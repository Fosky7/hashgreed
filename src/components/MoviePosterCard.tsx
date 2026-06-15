import React from 'react';
import { Link } from 'react-router-dom';
import { Movie } from '../types/movie';

interface MoviePosterCardProps {
  movie: Movie;
}

const MoviePosterCard: React.FC<MoviePosterCardProps> = ({ movie }) => {
  const { id, title, posterUrl, rating, year, genre } = movie;

  return (
    <Link
      to={`/movie/${id}`}
      aria-label={`View details for ${title} (${year}), rated ${rating} out of 10`}
      className="group block rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--card-bg)] shadow-md hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
    >
      <div className="relative">
        <img
          src={posterUrl}
          alt={`${title} movie poster`}
          loading="lazy"
          className="w-full aspect-[2/3] object-cover transform group-hover:scale-105 transition-transform duration-300 ease-in-out"
        />
        <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-black/70 text-yellow-300 shadow-md">
          <span aria-hidden="true">★</span> {rating.toFixed(1)}
        </span>
        <span className="absolute top-2 left-2 px-2 py-1 rounded-full text-[11px] font-semibold bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] shadow-md">
          {genre}
        </span>
      </div>
      <div className="p-3">
        <h3 className="text-sm md:text-base font-bold text-[var(--text-primary)] truncate" title={title}>
          {title}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-[var(--text-secondary)]">{year}</p>
          <span className="text-xs font-semibold text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            View &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
};

export default MoviePosterCard;
