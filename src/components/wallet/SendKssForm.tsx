// src/components/wallet/SendKssForm.tsx
import { useState } from "react";
import { Send, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { sendKss } from "@/lib/blockchain/kross/sendKss";
import { isValidKrossAddress } from "@/lib/blockchain/kross/sdk";

interface Props {
  balance: number | null;
  onSuccess?: () => void;
  onClose?: () => void;
}

const TRANSFER_FEE = 0.001; // KSS

type Status = "idle" | "sending" | "success" | "error";

export function SendKssForm({ balance, onSuccess, onClose }: Props) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [attachment, setAttachment] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [txId, setTxId] = useState("");

  const amountNum = parseFloat(amount);
  const addrValid = recipient === "" || isValidKrossAddress(recipient);
  const max =
    balance !== null ? Math.max(0, balance - TRANSFER_FEE) : null;
  const overBalance =
    max !== null && !isNaN(amountNum) && amountNum > max;

  const canSubmit =
    isValidKrossAddress(recipient) &&
    amountNum > 0 &&
    !overBalance &&
    status !== "sending";

  const setMax = () => {
    if (max !== null) setAmount(max.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("sending");
    setMessage("");
    try {
      const res = await sendKss(recipient.trim(), amountNum, attachment.trim());
      setTxId(res.id);
      setStatus("success");
      setMessage(`Sent ${amountNum} KSS successfully.`);
      setRecipient("");
      setAmount("");
      setAttachment("");
      onSuccess?.();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Transaction failed.");
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 backdrop-blur-xl shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15">
            <Send className="h-4.5 w-4.5 text-indigo-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90">Send KSS</h3>
            <p className="text-xs text-white/40">Transfer native Kross coin</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white/70"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Recipient */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/60">
            Recipient Address
          </label>
          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="3K..."
            spellCheck={false}
            className={`w-full rounded-xl border bg-white/[0.03] px-3.5 py-2.5 font-mono text-sm text-white placeholder:text-white/25 outline-none transition focus:border-indigo-500/50 focus:bg-white/[0.05] ${
              addrValid ? "border-white/10" : "border-rose-500/50"
            }`}
          />
          {!addrValid && (
            <p className="mt-1 text-xs text-rose-400">
              Must be a valid Kross address starting with 3K.
            </p>
          )}
        </div>

        {/* Amount */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-medium text-white/60">Amount</label>
            <button
              type="button"
              onClick={setMax}
              disabled={max === null}
              className="text-xs font-medium text-indigo-300 transition hover:text-indigo-200 disabled:opacity-40"
            >
              Max:{" "}
              {max === null
                ? "—"
                : max.toLocaleString(undefined, { maximumFractionDigits: 4 })}{" "}
              KSS
            </button>
          </div>
          <div className="relative">
            <input
              type="number"
              step="any"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className={`w-full rounded-xl border bg-white/[0.03] px-3.5 py-2.5 pr-16 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-indigo-500/50 focus:bg-white/[0.05] ${
                overBalance ? "border-rose-500/50" : "border-white/10"
              }`}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-white/40">
              KSS
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className={overBalance ? "text-rose-400" : "text-white/30"}>
              {overBalance ? "Exceeds spendable balance" : `Network fee: ${TRANSFER_FEE} KSS`}
            </span>
          </div>
        </div>

        {/* Attachment (optional) */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/60">
            Note <span className="text-white/30">(optional)</span>
          </label>
          <input
            value={attachment}
            onChange={(e) => setAttachment(e.target.value)}
            placeholder="Add a message..."
            maxLength={140}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-indigo-500/50 focus:bg-white/[0.05]"
          />
        </div>

        {/* Status banner */}
        {status === "success" && (
          <a
            href={`https://krossexplorer.com/tx/${txId}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300 transition hover:bg-emerald-500/15"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="flex-1">{message}</span>
            <span className="text-xs underline underline-offset-2">View</span>
          </a>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === "sending" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send KSS
            </>
          )}
        </button>
      </form>
    </div>
  );
}
