type CreateNftChecklistProps = {
  hasTitle: boolean;
  hasArtwork: boolean;
  hasCategory: boolean;
  hasDescription: boolean;
  walletConnected: boolean;
  walletUnlocked: boolean;
  priceReady: boolean;
  isListing: boolean;
};

type Item = {
  label: string;
  detail: string;
  done: boolean;
};

function ChecklistItem({ item }: { item: Item }) {
  return (
    <div className='flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--hover-bg)] px-4 py-3'>
      <div className='min-w-0'>
        <p className='text-sm font-semibold text-[var(--text-primary)]'>{item.label}</p>
        <p className='mt-0.5 text-xs text-[var(--text-secondary)]'>{item.detail}</p>
      </div>
      <span className={item.done ? 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-success)] text-sm font-black text-white' : 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border-color)] text-sm text-[var(--text-secondary)]'}>
        {item.done ? '✓' : '—'}
      </span>
    </div>
  );
}

export default function CreateNftChecklist(props: CreateNftChecklistProps) {
  const items: Item[] = [
    { label: 'Artwork uploaded', detail: 'Image CID is ready for metadata', done: props.hasArtwork },
    { label: 'Title added', detail: 'Collectors can identify the piece', done: props.hasTitle },
    { label: 'Category selected', detail: 'Marketplace discovery is configured', done: props.hasCategory },
    { label: 'Description written', detail: 'Story and utility are documented', done: props.hasDescription },
    { label: 'Wallet connected', detail: 'Creator address is available', done: props.walletConnected },
    { label: 'Wallet unlocked', detail: 'Signing can begin securely', done: props.walletUnlocked },
    { label: props.isListing ? 'Listing price valid' : 'Mint-only pricing', detail: props.isListing ? 'Price is ready for marketplace listing' : 'Blank or zero price will mint unlisted', done: props.priceReady },
  ];

  const completed = items.filter((item) => item.done).length;

  return (
    <section className='rounded-[2rem] border border-[var(--border-color)] bg-[var(--card-bg)] p-5 shadow-lg md:p-6'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h2 className='text-lg font-black text-[var(--text-primary)]'>Readiness checklist</h2>
          <p className='mt-1 text-sm text-[var(--text-secondary)]'>{completed} of {items.length} complete</p>
        </div>
        <div className='rounded-full border border-[var(--border-color)] bg-[var(--hover-bg)] px-3 py-1 text-xs font-bold text-[var(--text-secondary)]'>
          {Math.round((completed / items.length) * 100)}%
        </div>
      </div>
      <div className='mt-4 space-y-3'>
        {items.map((item) => <ChecklistItem key={item.label} item={item} />)}
      </div>
    </section>
  );
}
