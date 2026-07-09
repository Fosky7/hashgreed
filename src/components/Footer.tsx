import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const links = [
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
    { href: '/privacy', label: 'Privacy Policy' },
  ];

  return (
    <footer className="mt-12 bg-gray-900 text-gray-400">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-10">
        <div className="flex flex-col items-center gap-4 border-t border-gray-800 pt-6 sm:flex-row sm:justify-between sm:gap-x-6">
          <p className="text-center text-sm leading-relaxed text-gray-400 sm:text-left">
            &copy; {currentYear} Chopam. All rights reserved.
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-md text-sm leading-relaxed text-gray-400 transition-colors duration-200 hover:text-primary-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
