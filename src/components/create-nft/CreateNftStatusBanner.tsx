export type CreateNftStatus =
  | { step: 'idle' }
  | { step: 'uploading'; message: string }
  | { step: 'minting'; message: string }
  | { step: 'listing'; message: string }
  | { step: 'done'; txId: string; explorerUrl: string; assetId?: string }
  | { step: 'error'; message: string; explorerUrl?: string; assetId?: string };

type CreateNftStatusBannerProps = {
  status: CreateNftStatus;
  assetExplorerUrl?: string;
};

function Spinner() {
  return <span className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' aria-hidden={true} />;
}

export default function CreateNftStatusBanner({ status, assetExplorerUrl }: CreateNftStatusBannerProps) {
  if (status.step === 'idle') return null;

  if (status.step === 'done') {
    return (
      <div role='status' className='rounded-2xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-4 py-3 text-sm text-[var(--text-primary)]'>
        <div className='flex items-start gap-3'>
          <span className='mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-success)] text-white'>✓</span>
          <div className='min-w-0'>
            <p className='font-bold'>NFT minted successfully</p>
            <p className='mt-1 text-xs leading-5 text-[var(--text-secondary)]'>Your transaction has been submitted to Kross and the asset is ready to view.</p>
            <div className='mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold'>
              <a href={status.explorerUrl} target='_blank' rel='noreferrer' className='text-[var(--color-primary)] underline underline-offset-2'>View transaction ↗</a>
              {status.assetId && assetExplorerUrl ? <a href={assetExplorerUrl} target='_blank' rel='noreferrer' className='text-[var(--color-primary)] underline underline-offset-2'>View asset ↗</a> : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status.step === 'error') {
    return (
      <div role='alert' className='rounded-2xl border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--text-primary)]'>
        <div className='flex items-start gap-3'>
          <span className='mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-error)] text-white'>!</span>
          <div className='min-w-0'>
            <p className='font-bold'>Action needed</p>
            <p className='mt-1 break-words text-xs leading-5 text-[var(--text-secondary)]'>{status.message}</p>
            {(status.explorerUrl || assetExplorerUrl) && (
              <div className='mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold'>
                {status.explorerUrl ? <a href={status.explorerUrl} target='_blank' rel='noreferrer' className='text-[var(--color-primary)] underline underline-offset-2'>Mint transaction ↗</a> : null}
                {assetExplorerUrl ? <a href={assetExplorerUrl} target='_blank' rel='noreferrer' className='text-[var(--color-primary)] underline underline-offset-2'>Minted asset ↗</a> : null}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const label = status.step === 'uploading' ? 'Preparing IPFS metadata' : status.step === 'minting' ? 'Minting on Kross' : 'Creating marketplace listing';

  return (
    <div role='status' className='rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-4 py-3 text-sm text-[var(--text-primary)]'>
      <div className='flex items-start gap-3'>
        <span className='mt-0.5 text-[var(--color-primary)]'><Spinner /></span>
        <div>
          <p className='font-bold'>{label}</p>
          <p className='mt-1 text-xs leading-5 text-[var(--text-secondary)]'>{status.message}</p>
        </div>
      </div>
    </div>
  );
}
