// src/pages/SendKss.tsx
import { useState } from 'react';
import { useKrossWallet } from '@/lib/blockchain/kross/WalletProvider';
import { KROSS_CONFIG } from '@/lib/blockchain/kross/config';
import { isValidKrossAddress } from '@/lib/blockchain/kross/sdk';
import { transferKSS, waitForTx } from '@/lib/blockchain/kross/transfer';

type Status = 'idle' | 'sending' | 'confirming' | 'done' | 'error';

export default function SendKss() {
  const { balance, refresh } = useKrossWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [attachment, setAttachment] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [txUrl, setTxUrl] = useState('');

  const fee = KROSS_CONFIG.fees.transfer;
  const amountNum = parseFloat(amount) || 0;
  const total = amountNum + fee;
  const insufficient = total > balance;
  const validAddr = recipient === '' || isValidKrossAddress(recipient);

  const canSend =
    isValidKrossAddress(recipient) &&
    amountNum > 0 &&
    !insufficient &&
    password.length >= 8 &&
    status !== 'sending' &&
    status !== 'confirming';

  const handleSend = async () => {
    setError('');
    setStatus('sending');
    try {
      const result = await transferKSS({
        recipient,
        amountKSS: amountNum,
        password,
        attachment,
        assetId: null,
      });
      setTxUrl(result.explorerUrl);
      setStatus('confirming');
      await waitForTx(result.id);
      setStatus('done');
      setPassword('');
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transfer failed.');
      setStatus('error');
    }
  };

  const setMax = () => {
    const max = Math.max(balance - fee, 0);
    setAmount(max.toString());
  };

  if (status === 'done') {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <h2 className="text-xl font-bold text-green-600">Sent!</h2>
        <p className="text-sm text-gray-600">
          {amountNum} {KROSS_CONFIG.nativeCoin} sent successfully.
        </p>
        <a
          href={txUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-indigo-600 underline"
        >
          View on Explorer
        </a>
        <a
          href="/wallet"
          className="block w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold"
        >
          Back to Wallet
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Send {KROSS_CONFIG.nativeCoin}</h1>
      <p className="text-sm text-gray-500">
        Available: {balance.toLocaleString(undefined, { maximumFractionDigits: 8 })}{' '}
        {KROSS_CONFIG.nativeCoin}
      </p>

      <div>
        <label className="text-sm font-medium">Recipient Address</label>
        <input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="3K..."
          className={`w-full p-3 rounded-xl border text-sm mt-1 ${
            !validAddr ? 'border-red-500' : ''
          }`}
        />
        {!validAddr && (
          <p className="text-xs text-red-600 mt-1">
            Invalid Kross address. Must match 3K followed by 33 alphanumeric
            characters.
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">Amount</label>
        <div className="relative mt-1">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="w-full p-3 rounded-xl border text-sm pr-16"
          />
          <button
            onClick={setMax}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-indigo-600 font-semibold"
          >
            MAX
          </button>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Note (optional)</label>
        <input
          value={attachment}
          onChange={(e) => setAttachment(e.target.value)}
          placeholder="Attachment message"
          className="w-full p-3 rounded-xl border text-sm mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Wallet Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password to sign"
          className="w-full p-3 rounded-xl border text-sm mt-1"
        />
      </div>

      {/* Fee summary */}
      <div className="rounded-xl bg-gray-50 p-4 text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-500">Amount</span>
          <span>{amountNum} {KROSS_CONFIG.nativeCoin}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Network Fee</span>
          <span>{fee} {KROSS_CONFIG.nativeCoin}</span>
        </div>
        <div className="flex justify-between font-semibold border-t pt-1">
          <span>Total</span>
          <span className={insufficient ? 'text-red-600' : ''}>
            {total} {KROSS_CONFIG.nativeCoin}
          </span>
        </div>
        {insufficient && (
          <p className="text-xs text-red-600">Insufficient balance.</p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        disabled={!canSend}
        onClick={handleSend}
        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-50"
      >
        {status === 'sending'
          ? 'Signing...'
          : status === 'confirming'
          ? 'Confirming...'
          : 'Send'}
      </button>
    </div>
  );
}
