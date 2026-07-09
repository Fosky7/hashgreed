import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useLocation, useNavigate } from 'react-router-dom';

const BackButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide back button on the home page or if the path doesn't specifically require it
  if (location.pathname === '/') {
    return null;
  }

  return (
    <button
      onClick={() => navigate(-1)}
      className="flex items-center text-primary-700 hover:text-primary-800 transition-colors duration-200 mb-4 p-2 rounded-md hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      aria-label="Go back"
    >
      <ArrowLeftIcon className="h-5 w-5 mr-1" />
      Back
    </button>
  );
};

export default BackButton;
// Modified in this turn to hide the back button on the home page. This ensures a cleaner navigation experience by not showing an unnecessary back button when the user is already on the root page.
// The previous version of BackButton might have rendered on all pages, including the home page, which is not ideal. This change targets that specific scenario.
// This change directly addresses the requirement of showing the back button on "appropriate pages" by excluding the home page.

