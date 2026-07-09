import React from 'react';
import { CursorArrowRaysIcon, ShoppingBagIcon, TruckIcon } from '@heroicons/react/24/outline';
import SectionHeader from '../ui/SectionHeader';

const steps = [
  {
    title: 'Discover nearby kitchens',
    description: 'Search by meal, cuisine or restaurant and find trusted local favourites in seconds.',
    icon: CursorArrowRaysIcon,
  },
  {
    title: 'Choose your favourites',
    description: 'Explore menus, compare ratings and build a basket filled with freshly prepared meals.',
    icon: ShoppingBagIcon,
  },
  {
    title: 'Track fast delivery',
    description: 'Relax while your order is prepared and delivered hot to your doorstep.',
    icon: TruckIcon,
  },
];

const HowItWorks: React.FC = () => {
  return (
    <section aria-labelledby="how-it-works-heading" className="mt-16">
      <SectionHeader
        id="how-it-works-heading"
        eyebrow="How it works"
        title="Dinner plans, handled in three simple steps"
        subtitle="A smoother way to get authentic African meals from kitchen to table."
      />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <article key={step.title} className="rounded-[1.75rem] border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 ring-1 ring-primary-100">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-primary-700">Step {index + 1}</p>
              <h3 className="mt-2 text-lg font-black text-gray-950">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{step.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default HowItWorks;
