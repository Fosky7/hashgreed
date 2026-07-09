type PayoutBreakdownCardProps = {
  price: number;
  fee: number;
  royalty: number;
  seller: number;
  feeWallet: string;
  feeBps: number;
  royaltyBps: number;
  currency?: string;
};

const formatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

function formatAmount(value: number, currency: string) {
  const safe = Number.isFinite(value) ? value : 0;
  return `${formatter.format(safe)} ${currency}`;
}

function formatPercent(bps: number) {
  const safe = Number.isFinite(bps) ? bps : 0;
  return `${formatter.format(safe / 100)}%`;
}

export default function PayoutBreakdownCard({
  price,
  fee,
  royalty,
  seller,
  feeWallet,
  feeBps,
  royaltyBps,
  currency = 'KSS',
}: PayoutBreakdownCardProps) {
  const hasPrice = Number.isFinite(price) && price > 0;

  return (
    <div className='rounded-[1.5rem] border border-[var(--border-color)] bg-[var(--hover-bg)] p-4'>
      <div className='flex items-start gap-3'>
        <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]'>
          <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' aria-hidden={true}>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.7} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 10v2m9-6a9 9 0 11-18 0 9 9 0 0118 0z' />
          </svg>
        </div>
        <div className='min-w-0'>
          <h3 className='text-sm font-bold text-[var(--text-primary)]'>Payout preview</h3>
          <p className='mt-1 text-xs leading-5 text-[var(--text-secondary)]'>
            {hasPrice
              ? `Estimated split for the initial listing. Marketplace fee is ${formatPercent(feeBps)} and royalty pool is ${formatPercent(royaltyBps)}.`
              : 'Set a price above zero to list immediately. Blank or zero mints an unlisted NFT.'}
          </p>
        </div>
      </div>

      <div className='mt-4 grid gap-2 sm:grid-cols-2'>
        <div className='rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-3'>
          <p className='text-xs text-[var(--text-secondary)]'>List total</p>
          <p className='mt-1 text-base font-black text-[var(--text-primary)]'>{formatAmount(hasPrice ? price : 0, currency)}</p>
        </div>
        <div className='rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-3'>
          <p className='text-xs text-[var(--text-secondary)]'>Creator proceeds</p>
          <p className='mt-1 text-base font-black text-[var(--text-primary)]'>{formatAmount(hasPrice ? seller : 0, currency)}</p>
        </div>
        <div className='rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-3'>
          <p className='text-xs text-[var(--text-secondary)]'>Royalty pool</p>
          <p className='mt-1 text-sm font-bold text-[var(--text-primary)]'>{formatAmount(hasPrice ? royalty : 0, currency)}</p>
        </div>
        <div className='rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-3'>
          <p className='text-xs text-[var(--text-secondary)]'>Marketplace fee</p>
          <p className='mt-1 text-sm font-bold text-[var(--text-primary)]'>{formatAmount(hasPrice ? fee : 0, currency)}</p>
        </div>
      </div>

      <p className='mt-3 break-all text-[11px] leading-5 text-[var(--text-secondary)]'>Treasury: {feeWallet || 'Marketplace treasury'}</p>
    </div>
  );
}
