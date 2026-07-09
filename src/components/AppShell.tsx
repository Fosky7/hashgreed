import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 antialiased">
      <Header />
      {isHomePage ? (
        <main className="flex-1">{children}</main>
      ) : (
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:py-10">
          {children}
        </main>
      )}
      <Footer />
    </div>
  );
};

export default AppShell;
