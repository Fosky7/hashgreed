// src/components/CategorySelect.tsx
import React, { useState, useRef, useEffect } from 'react';

interface CategoryOption {
  id: string;
  label: string;
}

interface Props {
  categories: CategoryOption[];
  value: string;
  onChange: (id: string) => void;
}

/**
 * Controlled dropdown with high z‑index so it appears above previews.
 */
const CategorySelect: React.FC<Props> = ({ categories, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedLabel = categories.find((c) => c.id === value)?.label || 'Select category';

  return (
    <div className="relative z-50" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border bg-[var(--card-bg)] text-sm"
      >
        <span>{selectedLabel}</span>
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul className="absolute left-0 right-0 mt-1 bg-[var(--card-bg)] border rounded-xl shadow-lg max-h-60 overflow-auto z-50">
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                type="button"
                onClick={() => { onChange(cat.id); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--hover-bg)] transition ${
                  value === cat.id ? 'font-semibold text-indigo-400' : ''
                }`}
              >
                {cat.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CategorySelect;
