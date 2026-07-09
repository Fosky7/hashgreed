type CategoryMeta = {
  id: string;
  label: string;
  emoji?: string;
};

type UploadResult = {
  cid: string;
  sha256?: string;
};

type CreateNftPreviewPanelProps = {
  imageUrl: string;
  title: string;
  description: string;
  creatorAddress?: string;
  category?: CategoryMeta;
  price: number;
  isListed: boolean;
  uploadResult: UploadResult | null;
  currency?: string;
};

function short(value?: string) {
  if (!value) return 'Connect wallet';
  return value.length > 14 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;
}

function truncateMiddle(value: string, head = 10, tail = 8) {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

const formatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 });

export default function CreateNftPreviewPanel({
  imageUrl,
  title,
  description,
  creatorAddress,
  category,
  price,
  isListed,
  uploadResult,
  currency = 'KSS',
}: CreateNftPreviewPanelProps) {
  const displayTitle = title.trim() || 'Untitled NFT';
  const displayDescription = description.trim() || 'Your NFT description will appear here once you describe the artwork, edition, or collection story.';

  return (
    <section className='sticky top-6 rounded-[2rem] border border-[var(--border-color)] bg-[var(--card-bg)] p-5 shadow-lg md:p-6'>
      <div className='mb-4 flex items-center justify-between gap-4'>
        <div>
          <h2 className='text-lg font-black text-[var(--text-primary)]'>Live marketplace preview</h2>
          <p className='mt-1 text-sm text-[var(--text-secondary)]'>Updates as you create.</p>
        </div>
        <span className='rounded-full border border-[var(--border-color)] bg-[var(--hover-bg)] px-3 py-1 text-xs font-bold text-[var(--text-secondary)]'>Preview</span>
      </div>

      <article className='overflow-hidden rounded-[1.75rem] border border-[var(--border-color)] bg-[var(--hover-bg)]'>
        <div className='relative aspect-square overflow-hidden bg-[var(--card-bg)]'>
          <img src={imageUrl} alt={displayTitle} className='h-full w-full object-cover' />
          <div className='pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 to-transparent' aria-hidden={true} />
          <div className='absolute left-4 top-4 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs font-bold text-white backdrop-blur'>
            {category?.emoji ? `${category.emoji} ` : ''}{category?.label || 'Category'}
          </div>
          <div className='absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white'>
            <div className='min-w-0'>
              <p className='text-xs opacity-80'>Creator</p>
              <p className='truncate text-sm font-bold'>{short(creatorAddress)}</p>
            </div>
            <div className='shrink-0 rounded-2xl bg-white/15 px-3 py-2 text-right backdrop-blur'>
              <p className='text-[10px] uppercase tracking-widest opacity-75'>{isListed ? 'Price' : 'Status'}</p>
              <p className='text-sm font-black'>{isListed ? `${formatter.format(price)} ${currency}` : 'Not listed'}</p>
            </div>
          </div>
        </div>

        <div className='p-5'>
          <h3 className='truncate text-2xl font-black text-[var(--text-primary)]'>{displayTitle}</h3>
          <p className='mt-3 line-clamp-4 text-sm leading-6 text-[var(--text-secondary)]'>{displayDescription}</p>

          {uploadResult?.cid ? (
            <div className='mt-4 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-3 text-xs text-[var(--text-secondary)]'>
              <div className='flex items-center justify-between gap-3'>
                <span className='font-semibold text-[var(--text-primary)]'>IPFS image CID</span>
                <span className='font-mono'>{truncateMiddle(uploadResult.cid)}</span>
              </div>
              {uploadResult.sha256 ? (
                <div className='mt-2 flex items-center justify-between gap-3'>
                  <span className='font-semibold text-[var(--text-primary)]'>SHA-256</span>
                  <span className='break-all text-right font-mono'>{truncateMiddle(uploadResult.sha256, 8, 8)}</span>
                </div>
              ) : null}
            </div>
          ) : (
            <div className='mt-4 rounded-2xl border border-dashed border-[var(--border-color)] p-3 text-xs text-[var(--text-secondary)]'>Upload artwork to attach IPFS provenance.</div>
          )}
        </div>
      </article>
    </section>
  );
}
