import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Changed from 'next/link' to 'react-router-dom Link'
import ThemeToggle from '../lib/ThemeToggle';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="flex items-center justify-between px-4 py-4 shadow-[var(--header-shadow)] transition-all duration-300 ease-in-out bg-[var(--header-bg)] sticky top-0 z-50">
      <div className="flex items-center">
        <Link to="/">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] cursor-pointer">
            Hashgreed
          </h1>
        </Link>
      </div>
      <nav className="hidden md:flex items-center space-x-4">
        <Link
          to="/explore"
          className="text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors duration-300 ease-in-out"
        >
          Explore
        </Link>
        <Link
          to="/create"
          className="text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors duration-300 ease-in-out"
        >
          Create
        </Link>
        <Link
          to="/wallet"
          className="text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors duration-300 ease-in-out"
        >
          My Wallet
        </Link>
        <button className="px-3 py-1 rounded-md bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover-bg)] transition-colors duration-300 ease-in-out">
          Connect Wallet
        </button>
        <ThemeToggle />
      </nav>

      <div className="flex items-center md:hidden">
        <ThemeToggle />
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="ml-3 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--text-secondary)]"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-16 left-0 w-full bg-[var(--header-bg)] shadow-lg md:hidden border-t border-[var(--border-color)]">
          <nav className="flex flex-col items-center py-4 space-y-3">
            <Link
              to="/explore"
              className="block text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors duration-300 ease-in-out py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Explore
            </Link>
            <Link
              to="/create"
              className="block text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors duration-300 ease-in-out py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Create
            </Link>
            <Link
              to="/wallet"
              className="block text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors duration-300 ease-in-out py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              My Wallet
            </Link>
            <button className="w-auto px-4 py-2 rounded-md bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover-bg)] transition-colors duration-300 ease-in-out mt-2">
              Connect Wallet
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
