import BackButton from '@/components/BackButton';

function shortAddress(address?: string) {
  if (!address) return 'Not connected';
  return address.length > 14 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}

type CreateNftHeroProps = {
  address?: string;
  unlocked: boolean;
};

export default function CreateNftHero({ address, unlocked }: CreateNftHeroProps) {
  return (
    <section className='relative mb-8 overflow-hidden rounded-[2rem] border border-[var(--border-color)] bg-[var(--card-bg)] p-5 shadow-lg md:p-8'>
      <div className='pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[var(--color-primary)]/10 blur-3xl' aria-hidden={true} />
      <div className='pointer-events-none absolute -bottom-28 left-12 h-56 w-56 rounded-full bg-[var(--accent-color,var(--color-primary))]/10 blur-3xl' aria-hidden={true} />

      <div className='relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
        <div className='max-w-3xl'>
          <BackButton to='/' label='Back' className='mb-6' />
          <p className='text-xs font-bold uppercase tracking-[0.32em] text-[var(--color-primary)]'>Kross NFT Studio</p>
          <h1 className='mt-3 text-3xl font-black tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl'>
            Create, mint, and list your NFT
          </h1>
          <p className='mt-4 max-w-2xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base'>
            Upload IPFS-backed artwork, craft collector-ready metadata, preview your marketplace card, then mint on Kross with optional listing in one guided workflow.
          </p>
          <div className='mt-5 flex flex-wrap gap-2'>
            {['IPFS metadata', 'Kross chain', 'Marketplace ready'].map((badge) => (
              <span key={badge} className='rounded-full border border-[var(--border-color)] bg-[var(--hover-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]'>
                {badge}
              </span>
            ))}
          </div>
        </div>

        <div className='min-w-0 rounded-2xl border border-[var(--border-color)] bg-[var(--hover-bg)] px-4 py-3'>
          <p className='text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--text-secondary)]'>Wallet</p>
          <div className='mt-2 flex items-center gap-2'>
            <span className={address && unlocked ? 'h-2.5 w-2.5 rounded-full bg-[var(--color-success)]' : 'h-2.5 w-2.5 rounded-full bg-[var(--color-warning,var(--color-primary))]'} />
            <span className='truncate text-sm font-bold text-[var(--text-primary)]'>{shortAddress(address)}</span>
          </div>
          <p className='mt-1 text-xs text-[var(--text-secondary)]'>
            {!address ? 'Connect a wallet to mint.' : unlocked ? 'Unlocked and ready.' : 'Wallet connected but locked.'}
          </p>
        </div>
      </div>
    </section>
  );
}
