import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type FormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  helper?: ReactNode;
  error?: ReactNode;
  counter?: ReactNode;
  children: ReactNode;
};

export function FormField({ id, label, required, helper, error, counter, children }: FormFieldProps) {
  return (
    <div className='space-y-2'>
      <div className='flex items-end justify-between gap-3'>
        <label htmlFor={id} className='text-sm font-semibold text-[var(--text-primary)]'>
          {label}
          {required ? <span className='ml-1 text-[var(--color-error)]'>*</span> : null}
        </label>
        {counter ? <div className='text-xs text-[var(--text-secondary)]'>{counter}</div> : null}
      </div>
      {children}
      {error ? <p className='text-xs font-medium text-[var(--color-error)]'>{error}</p> : null}
      {helper && !error ? <p className='text-xs leading-5 text-[var(--text-secondary)]'>{helper}</p> : null}
    </div>
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-2xl border border-[var(--border-color)] bg-[var(--input-bg,var(--card-bg))] px-4 py-3.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-placeholder,var(--text-secondary))] disabled:cursor-not-allowed disabled:opacity-60 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20',
        className
      )}
      {...props}
    />
  );
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full resize-y rounded-2xl border border-[var(--border-color)] bg-[var(--input-bg,var(--card-bg))] px-4 py-3.5 text-sm leading-6 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-placeholder,var(--text-secondary))] disabled:cursor-not-allowed disabled:opacity-60 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20',
        className
      )}
      {...props}
    />
  );
}
