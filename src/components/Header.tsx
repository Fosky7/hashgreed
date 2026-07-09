import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  Bars3Icon,
  MapPinIcon,
  ShoppingCartIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { CartContext } from '../hooks/useCart';
import ChopamLogo from '../assets/chopam-logo.png';

interface NavItem {
  label: string;
  href: string;
  end?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/', end: true },
  { label: 'My Orders', href: '/orders' },
];

const formatCartCount = (count: number): string => (count > 99 ? '99+' : String(count));

const getDesktopNavLinkClasses = ({ isActive }: { isActive: boolean }): string => {
  const baseClasses =
    'inline-flex items-center rounded-full px-4 py-2 text-sm font-bold transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2';

  return isActive
    ? `${baseClasses} bg-primary-50 text-primary-700 ring-1 ring-primary-100`
    : `${baseClasses} text-gray-600 hover:bg-gray-50 hover:text-primary-700`;
};

const getMobileNavLinkClasses = ({ isActive }: { isActive: boolean }): string => {
  const baseClasses =
    'flex items-center justify-between rounded-2xl px-4 py-3 text-base font-bold transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2';

  return isActive
    ? `${baseClasses} bg-primary-50 text-primary-700 ring-1 ring-primary-100`
    : `${baseClasses} text-gray-700 hover:bg-gray-50 hover:text-primary-700`;
};

const Header: React.FC = () => {
  const { cartItems } = useContext(CartContext);
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const totalItemsInCart = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems]
  );

  const cartCountLabel = `${totalItemsInCart} item${totalItemsInCart === 1 ? '' : 's'}`;
  const cartBadgeLabel = formatCartCount(totalItemsInCart);
  const mobileMenuId = 'chopam-mobile-navigation';

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [isMenuOpen]);

  const closeMobileMenu = () => setIsMenuOpen(false);

  const cartLinkClasses =
    'relative inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-2.5 text-gray-700 shadow-sm transition duration-200 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2';

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="flex min-h-[4.75rem] items-center justify-between gap-3 py-2.5 lg:min-h-[5.5rem] lg:py-3">
          <Link
            to="/"
            className="group flex min-w-0 items-center rounded-2xl no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            aria-label="Chopam home"
            onClick={closeMobileMenu}
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition duration-200 group-hover:ring-primary-200 sm:h-16 sm:w-16 lg:h-18 lg:w-18">
              <img
                src={ChopamLogo}
                alt="Chopam"
                className="h-12 w-auto select-none object-contain sm:h-14 lg:h-16"
              />
            </span>
            <span className="ml-3 hidden min-w-0 md:block">
              <span className="block text-lg font-black leading-tight tracking-tight text-gray-950 lg:text-xl">
                Chopam
              </span>
              <span className="mt-0.5 block max-w-[13rem] truncate text-xs font-semibold text-gray-500 lg:max-w-none lg:text-sm">
                Fresh African meals, delivered fast
              </span>
            </span>
          </Link>

          <nav aria-label="Primary navigation" className="hidden items-center rounded-full border border-gray-100 bg-white/80 p-1 shadow-sm lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.end}
                className={getDesktopNavLinkClasses}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm xl:flex">
              <MapPinIcon className="h-4 w-4 text-primary-600" aria-hidden="true" />
              <span>Lagos</span>
              <span className="h-1 w-1 rounded-full bg-gray-300" aria-hidden="true" />
              <span className="text-gray-500">25–40 min</span>
            </div>

            <Link
              to="/#explore-restaurants"
              className="hidden rounded-full bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition duration-200 hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 md:inline-flex"
            >
              Order now
            </Link>

            <NavLink
              to="/cart"
              className={({ isActive }) =>
                isActive
                  ? `${cartLinkClasses} border-primary-200 bg-primary-50 text-primary-700 ring-1 ring-primary-100`
                  : cartLinkClasses
              }
              aria-label={`Cart with ${cartCountLabel}`}
            >
              <ShoppingCartIcon className="h-6 w-6" aria-hidden="true" />
              {totalItemsInCart > 0 && (
                <span
                  className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary-600 px-1.5 text-[0.6875rem] font-black leading-none text-white ring-2 ring-white"
                  aria-hidden="true"
                >
                  {cartBadgeLabel}
                </span>
              )}
            </NavLink>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-2.5 text-gray-700 shadow-sm transition duration-200 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 lg:hidden"
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMenuOpen}
              aria-controls={mobileMenuId}
              onClick={() => setIsMenuOpen((current) => !current)}
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <div
          id={mobileMenuId}
          className={`${isMenuOpen ? 'block' : 'hidden'} pb-4 lg:hidden`}
        >
          <div className="overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-card ring-1 ring-gray-100">
            <div className="border-b border-gray-100 bg-gradient-to-r from-primary-50 via-white to-gray-50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <SparklesIcon className="h-4 w-4 text-primary-600" aria-hidden="true" />
                Fresh African meals, delivered fast
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-gray-500">
                <MapPinIcon className="h-3.5 w-3.5 text-primary-600" aria-hidden="true" />
                Lagos delivery • 25–40 min
              </div>
            </div>

            <nav aria-label="Mobile primary navigation" className="space-y-1 p-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.end}
                  className={getMobileNavLinkClasses}
                  onClick={closeMobileMenu}
                >
                  <span>{item.label}</span>
                  <span className="text-xs font-semibold text-gray-400" aria-hidden="true">
                    →
                  </span>
                </NavLink>
              ))}
            </nav>

            <div className="border-t border-gray-100 p-2">
              <NavLink
                to="/cart"
                className={({ isActive }) =>
                  `${getMobileNavLinkClasses({ isActive })} ${isActive ? '' : 'bg-gray-50'}`
                }
                aria-label={`Cart with ${cartCountLabel}`}
                onClick={closeMobileMenu}
              >
                <span className="inline-flex items-center gap-3">
                  <span className="relative inline-flex rounded-full bg-white p-2 text-primary-700 ring-1 ring-gray-200">
                    <ShoppingCartIcon className="h-5 w-5" aria-hidden="true" />
                    {totalItemsInCart > 0 && (
                      <span
                        className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary-600 px-1 text-[0.625rem] font-black leading-none text-white ring-2 ring-white"
                        aria-hidden="true"
                      >
                        {cartBadgeLabel}
                      </span>
                    )}
                  </span>
                  <span>
                    <span className="block">Cart</span>
                    <span className="block text-xs font-semibold text-gray-500">{cartCountLabel}</span>
                  </span>
                </span>
                <span className="text-xs font-semibold text-gray-400" aria-hidden="true">
                  →
                </span>
              </NavLink>

              <Link
                to="/#explore-restaurants"
                className="mt-2 flex items-center justify-center rounded-2xl bg-primary-600 px-4 py-3 text-base font-black text-white shadow-sm transition duration-200 hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                onClick={closeMobileMenu}
              >
                Order now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
