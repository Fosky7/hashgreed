import CategorySelect from '@/components/CategorySelect';
import ImageUploader from '@/components/ImageUploader';
import { cn } from '@/lib/utils';
import CreateNftStatusBanner, { type CreateNftStatus } from './CreateNftStatusBanner';
import { FormField, TextArea, TextInput } from './FormField';
import PayoutBreakdownCard from './PayoutBreakdownCard';

type CategoryOption = {
  id: string;
  label: string;
};

type UploadResult = {
  cid: string;
  sha256?: string;
  url: string;
};

type PayoutSplit = {
  price: number;
  fee: number;
  royalty: number;
  seller: number;
  feeWallet: string;
};

type CreateNftFormPanelProps = {
  name: string;
  description: string;
  category: string;
  priceKss: string;
  imageValue?: string;
  categories: CategoryOption[];
  payoutSplit: PayoutSplit;
  feeBps: number;
  royaltyBps: number;
  status: CreateNftStatus;
  isProcessing: boolean;
  canSubmit: boolean;
  submitLabel: string;
  processingLabel: string;
  priceError?: string;
  uploadError?: string;
  assetExplorerUrl?: string;
  currency?: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onImageUploaded: (result: UploadResult) => void;
  onImageClear: () => void;
  onCancel: () => void;
  onCreateAnother: () => void;
  onSubmit: () => void;
};

function StepHeader({ number, title, copy }: { number: string; title: string; copy: string }) {
  return (
    <div className='mb-4 flex items-start gap-3'>
      <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)] text-sm font-black text-[var(--button-primary-text,#fff)]'>{number}</span>
      <div>
        <h3 className='text-base font-black text-[var(--text-primary)]'>{title}</h3>
        <p className='mt-1 text-xs leading-5 text-[var(--text-secondary)]'>{copy}</p>
      </div>
    </div>
  );
}

export default function CreateNftFormPanel({
  name,
  description,
  category,
  priceKss,
  imageValue,
  categories,
  payoutSplit,
  feeBps,
  royaltyBps,
  status,
  isProcessing,
  canSubmit,
  submitLabel,
  processingLabel,
  priceError,
  uploadError,
  assetExplorerUrl,
  currency = 'KSS',
  onNameChange,
  onDescriptionChange,
  onCategoryChange,
  onPriceChange,
  onImageUploaded,
  onImageClear,
  onCancel,
  onCreateAnother,
  onSubmit,
}: CreateNftFormPanelProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      aria-busy={isProcessing}
      className='rounded-[2rem] border border-[var(--border-color)] bg-[var(--card-bg)] p-5 shadow-lg md:p-8'
    >
      <div className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <p className='text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-primary)]'>Guided workflow</p>
          <h2 className='mt-2 text-2xl font-black tracking-tight text-[var(--text-primary)]'>Creator studio</h2>
          <p className='mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]'>Each section feeds your live marketplace preview and final on-chain metadata.</p>
        </div>
      </div>

      <div className='space-y-8'>
        <section className='rounded-[1.75rem] border border-[var(--border-color)] bg-[var(--hover-bg)] p-4 md:p-5'>
          <StepHeader number='1' title='Artwork' copy='Upload the image first so the minted NFT references a real IPFS CID.' />
          <div className='rounded-[1.5rem] border border-dashed border-[var(--border-color)] bg-[var(--card-bg)] p-3'>
            <ImageUploader value={imageValue} onUploaded={onImageUploaded} onClear={onImageClear} error={uploadError} />
          </div>
          <p className='mt-3 text-xs leading-5 text-[var(--text-secondary)]'>Supports image formats validated by the uploader. Recommended: square artwork at 1200×1200 or higher.</p>
        </section>

        <section>
          <StepHeader number='2' title='Details' copy='Give collectors a clear name, category, and story.' />
          <div className='grid gap-5 md:grid-cols-[1.35fr_0.65fr]'>
            <FormField id='create-nft-title' label='Title' required counter={`${name.length}/80`} helper='Use a memorable, searchable title.'>
              <TextInput id='create-nft-title' value={name} onChange={(event) => onNameChange(event.target.value)} placeholder='Enter a memorable name' disabled={isProcessing} maxLength={120} />
            </FormField>
            <FormField id='create-nft-category' label='Category' required helper='Used for marketplace discovery.'>
              <div id='create-nft-category' className='relative z-30'>
                <CategorySelect categories={categories} value={category} onChange={onCategoryChange} />
              </div>
            </FormField>
          </div>
          <div className='mt-5'>
            <FormField id='create-nft-description' label='Description' required counter={`${description.length}/500`} helper='Explain the artwork, collection, utility, or unlockable context.'>
              <TextArea id='create-nft-description' rows={5} value={description} onChange={(event) => onDescriptionChange(event.target.value)} placeholder='Tell collectors what makes this NFT special' disabled={isProcessing} maxLength={1000} />
            </FormField>
          </div>
        </section>

        <section>
          <StepHeader number='3' title='Pricing' copy='Leave blank or enter 0 to mint now and list later.' />
          <FormField id='create-nft-price' label={`List price (${currency})`} error={priceError} helper='Positive prices create a marketplace listing after minting.'>
            <TextInput id='create-nft-price' type='number' min='0' step='0.01' inputMode='decimal' value={priceKss} onChange={(event) => onPriceChange(event.target.value)} placeholder='0.00' disabled={isProcessing} />
          </FormField>
          <div className='mt-5'>
            <PayoutBreakdownCard {...payoutSplit} feeBps={feeBps} royaltyBps={royaltyBps} currency={currency} />
          </div>
        </section>

        <section>
          <StepHeader number='4' title='Review & mint' copy='Confirm the checklist and sign from your unlocked wallet.' />
          <CreateNftStatusBanner status={status} assetExplorerUrl={assetExplorerUrl} />

          <div className='mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end'>
            <button type='button' onClick={onCancel} disabled={isProcessing} className='rounded-2xl border border-[var(--border-color)] bg-transparent px-5 py-3 text-sm font-bold text-[var(--text-primary)] transition hover:bg-[var(--hover-bg)] disabled:cursor-not-allowed disabled:opacity-50'>
              Cancel
            </button>
            {status.step === 'done' ? (
              <button type='button' onClick={onCreateAnother} className='rounded-2xl bg-[var(--button-primary-bg)] px-5 py-3 text-sm font-bold text-[var(--button-primary-text)] shadow-lg transition hover:bg-[var(--button-primary-hover-bg)]'>
                Create another
              </button>
            ) : (
              <button
                type='submit'
                disabled={!canSubmit || isProcessing}
                aria-busy={isProcessing}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition',
                  canSubmit && !isProcessing
                    ? 'bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] shadow-lg hover:bg-[var(--button-primary-hover-bg)]'
                    : 'cursor-not-allowed bg-[var(--hover-bg)] text-[var(--text-secondary)]'
                )}
              >
                {isProcessing ? <span className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' aria-hidden={true} /> : null}
                {isProcessing ? processingLabel : submitLabel}
              </button>
            )}
          </div>
        </section>
      </div>
    </form>
  );
}
