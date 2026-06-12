import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-12 px-4 py-6 text-center text-[var(--text-secondary)] bg-[var(--footer-bg)] shadow-[var(--footer-shadow)] transition-all duration-300 ease-in-out">
      <p>&copy; {currentYear} Hashgreed. All rights reserved.</p>
      <div className="mt-2 flex justify-center space-x-4">
        <a href="#" className="hover:text-[var(--color-primary)] transition-colors duration-300 ease-in-out">Terms of Service</a>
        <a href="#" className="hover:text-[var(--color-primary)] transition-colors duration-300 ease-in-out">Privacy Policy</a>
        <a href="#" className="hover:text-[var(--color-primary)] transition-colors duration-300 ease-in-out">Contact Us</a>
      </div>
    </footer>
  );
};

export default Footer;
