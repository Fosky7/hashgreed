;

export const movieCategories: MovieCategory[] = [
  {
    id: 'sci-fi',
    name: 'Sci-Fi & Beyond',
    curator: 'Hashgreed Cinema',
    description:
      'Mind-bending journeys through space, time and technology. Explore the boldest visions of tomorrow from visionary filmmakers across decades.',
    bannerUrl: 'https://gtbwpdlebllwrfzgvwfl.supabase.co/storage/v1/object/public/project-assets/5f928b6f-e98b-4b5f-a7ea-25e0082af39e/assets/movies-scifi-banner.png',
  },
  {
    id: 'action',
    name: 'Action & Adventure',
    curator: 'Hashgreed Cinema',
    description:
      'High-octane thrills, daring heists and epic quests. The category for adrenaline seekers who love spectacle and edge-of-your-seat stakes.',
    bannerUrl: 'https://gtbwpdlebllwrfzgvwfl.supabase.co/storage/v1/object/public/project-assets/5f928b6f-e98b-4b5f-a7ea-25e0082af39e/assets/movies-action-banner.png',
  },
  {
    id: 'drama',
    name: 'Award-Winning Drama',
    curator: 'Hashgreed Cinema',
    description:
      'Powerful storytelling and unforgettable performances. A curated shelf of critically acclaimed dramas that linger long after the credits roll.',
    bannerUrl: 'https://gtbwpdlebllwrfzgvwfl.supabase.co/storage/v1/object/public/project-assets/5f928b6f-e98b-4b5f-a7ea-25e0082af39e/assets/movies-drama-banner.png',
  },
];

export const movies: Movie[] = [
  // --- Sci-Fi ---
  { id: 'm1', categoryId: 'sci-fi', title: 'Orbital Drift', posterUrl: 'https://gtbwpdlebllwrfzgvwfl.supabase.co/storage/v1/object/public/project-assets/5f928b6f-e98b-4b5f-a7ea-25e0082af39e/assets/movie-poster-scifi-1.png', rating: 8.6, year: 2023, genre: 'Sci-Fi', director: 'Lena Vasquez', synopsis: 'A lone engineer fights to keep a dying space station alive.' },
  { id: 'm2', categoryId: 'sci-fi', title: 'Echoes of Tomorrow', posterUrl: '{{ASSET:movie-poster-scifi-2.jpg}}', rating: 7.9, year: 2021, genre: 'Sci-Fi', director: 'Marcus Reid', synopsis: 'Time loops threaten to unravel a quiet coastal town.' },
  { id: 'm3', categoryId: 'sci-fi', title: 'The Quantum Garden', posterUrl: 'https://gtbwpdlebllwrfzgvwfl.supabase.co/storage/v1/object/public/project-assets/5f928b6f-e98b-4b5f-a7ea-25e0082af39e/assets/movie-poster-scifi-1.png', rating: 8.1, year: 2024, genre: 'Mystery', director: 'Aria Solis', synopsis: 'A physicist discovers a garden that grows alternate realities.' },
  { id: 'm4', categoryId: 'sci-fi', title: 'Neon Exodus', posterUrl: '{{ASSET:movie-poster-scifi-2.jpg}}', rating: 7.4, year: 2019, genre: 'Sci-Fi', director: 'Dax Holloway', synopsis: 'Refugees flee a collapsing megacity in search of clean air.' },
  { id: 'm5', categoryId: 'sci-fi', title: 'Signal Lost', posterUrl: 'https://gtbwpdlebllwrfzgvwfl.supabase.co/storage/v1/object/public/project-assets/5f928b6f-e98b-4b5f-a7ea-25e0082af39e/assets/movie-poster-scifi-1.png', rating: 8.8, year: 2022, genre: 'Thriller', director: 'Priya Nandakumar', synopsis: 'A deep-space crew receives a transmission from themselves.' },

  // --- Action ---
  { id: 'm6', categoryId: 'action', title: 'Iron Horizon', posterUrl: 'https://gtbwpdlebllwrfzgvwfl.supabase.co/storage/v1/object/public/project-assets/5f928b6f-e98b-4b5f-a7ea-25e0082af39e/assets/movie-poster-action-1.png', rating: 7.7, year: 2023, genre: 'Action', director: 'Cole Bennett', synopsis: 'An ex-soldier must stop a runaway weapons convoy.' },
  { id: 'm7', categoryId: 'action', title: 'Velocity', posterUrl: '{{ASSET:movie-poster-action-2.jpg}}', rating: 8.2, year: 2024, genre: 'Action', director: 'Nina Castellano', synopsis: 'A street racer is pulled into an international heist.' },
  { id: 'm8', categoryId: 'action', title: 'Crimson Tide Rising', posterUrl: 'https://gtbwpdlebllwrfzgvwfl.supabase.co/storage/v1/object/public/project-assets/5f928b6f-e98b-4b5f-a7ea-25e0082af39e/assets/movie-poster-action-1.png', rating: 7.1, year: 2020, genre: 'Adventure', director: 'Theo Marsh', synopsis: 'Treasure hunters race a storm to a sunken city.' },
  { id: 'm9', categoryId: 'action', title: 'Last Stand at Dawn', posterUrl: '{{ASSET:movie-poster-action-2.jpg}}', rating: 8.5, year: 2022, genre: 'Action', director: 'Ravi Kapoor', synopsis: 'A small town defends itself against a ruthless syndicate.' },

  // --- Drama ---
  { id: 'm10', categoryId: 'drama', title: 'The Quiet Hours', posterUrl: 'https://gtbwpdlebllwrfzgvwfl.supabase.co/storage/v1/object/public/project-assets/5f928b6f-e98b-4b5f-a7ea-25e0082af39e/assets/movie-poster-drama-1.png', rating: 9.0, year: 2023, genre: 'Drama', director: 'Eleanor Whitfield', synopsis: 'A widow rebuilds her life through letters to a stranger.' },
  { id: 'm11', categoryId: 'drama', title: 'Paper Boats', posterUrl: '{{ASSET:movie-poster-drama-2.jpg}}', rating: 8.4, year: 2021, genre: 'Drama', director: 'Yusuf Adeyemi', synopsis: 'Two siblings reconnect over a forgotten childhood promise.' },
  { id: 'm12', categoryId: 'drama', title: 'Where the Light Falls', posterUrl: 'https://gtbwpdlebllwrfzgvwfl.supabase.co/storage/v1/object/public/project-assets/5f928b6f-e98b-4b5f-a7ea-25e0082af39e/assets/movie-poster-drama-1.png', rating: 8.7, year: 2024, genre: 'Romance', director: 'Sofia Marchetti', synopsis: 'A painter and a musician fall in love across a single summer.' },
  { id: 'm13', categoryId: 'drama', title: 'The Weight of Silence', posterUrl: '{{ASSET:movie-poster-drama-2.jpg}}', rating: 8.9, year: 2019, genre: 'Drama', director: 'Henrik Lund', synopsis: 'A trial forces a community to confront its buried truths.' },
];

export const getMoviesByCategory = (categoryId: string): Movie[] =>
  movies.filter((m) => m.categoryId === categoryId);
