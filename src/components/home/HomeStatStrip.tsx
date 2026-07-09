import React from 'react';
import { CheckBadgeIcon, ClockIcon, CreditCardIcon, StarIcon } from '@heroicons/react/24/outline';

const stats = [
  { label: 'Average delivery', value: '30 min', icon: ClockIcon },
  { label: 'Customer rating', value: '4.7/5', icon: StarIcon },
  { label: 'Verified kitchens', value: '100%', icon: CheckBadgeIcon },
  { label: 'Secure checkout', value: 'Protected', icon: CreditCardIcon },
];

const HomeStatStrip: React.FC = () => {
  return (
    <section aria-label="Chopam trust metrics" className="bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <div className="grid grid-cols-2 gap-3 rounded-[2rem] border border-gray-100 bg-white p-3 shadow-card md:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-3xl bg-gray-50 p-4 sm:p-5">
                <Icon className="h-6 w-6 text-primary-600" aria-hidden="true" />
                <p className="mt-3 text-xl font-black tracking-tight text-gray-950 sm:text-2xl">{stat.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HomeStatStrip;
