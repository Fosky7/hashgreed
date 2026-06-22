// src/components/ListNftModal.tsx
import { useEffect, useState } from "react";
import {
  X,
  Tag,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ImageOff,
} from "lucide-react";
import { listNft } from "@/lib/blockchain/kross/listNft";
import type { OwnedNft } from "@/lib/blockchain/kross/fetchNfts";
import {
  NFT_CATEGORIES,
  isValidCategory,
  type NftCategoryId,
} from "@/lib/blockchain/kross/categories";

const EXPLORER = "https://krossexplorer.com";
const MAX_ROYALTY_PCT = 25;
const FEE_BPS = 200; // display-only marketplace fee estimate (2%)

interface Props {
  nft: OwnedNft;
  onClose: () => void;
  /** Receives the chosen category so the parent can track it front-end side. */
  onListed: (assetId: string, category: NftCategoryId) => void;
}

type Status = "idle" | "listing" | "success" | "error";

export default function ListNftModal({ nft, onClose, onListed }: Props) {
  const [price, setPrice] = useState("");
  const [royalty, setRoyalty] = useState("5");
  const [category, setCategory] = useState<NftCategoryId | "">("");
  const [touchedCategory, setTouchedCategory] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [txId, setTxId] = useState("");
  const [imgError, setImgError] = useState(false);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && status !== "listing") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, status]);

  const priceNum = Number(price);
  const royaltyNum = Number(royalty);
  const priceValid = Number.isFinite(priceNum) && priceNum > 0;
  const royaltyValid =
    Number.isFinite(royaltyNum) &&
    royaltyNum >= 0 &&
    royaltyNum <= MAX_ROYALTY_PCT;
  const categoryValid = category !== "" && isValidCategory(category);

  const canList =
    priceValid && royaltyValid && categoryValid && status !== "listing";

  const feeKss = priceValid ? (priceNum * FEE_BPS) / 10000 : 0;
  const royaltyKss = priceValid ? (priceNum * royaltyNum) / 100 : 0;
  const netKss = priceValid ? priceNum - feeKss - royaltyKss : 0;

  const handleList = async () => {
    if (!categoryValid) {
      setTouchedCategory(true);
      return;
    }
    if (!canList) return;
    setStatus("listing");
    setMessage("");
    try {
      // Category is NOT sent to the contract — front-end managed only.
      const res = await listNft({
        assetId: nft.assetId,
        priceKss: price,
        royaltyBps: Math.round(royaltyNum * 100),
      });
      setTxId(res.txId);
      setStatus("success");
      setMessage(`"${nft.name}" is now listed!`);
      onListed(nft.assetId, category as NftCategoryId);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Listing failed.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => status !== "listing" && onClose()}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#15131f] to-[#0d0c14] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-indigo-300" />
            <h2 className="text-sm font-semibold text-white">
              List on Marketplace
            </h2>
          </div>
          <button
            onClick={() => status !== "listing" && onClose()}
            disabled={status === "listing"}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/5 hover:text-white disabled:opacity-30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto p-5">
          {status === "success" ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <p className="text-sm font-medium text-white">{message}</p>
              <a
                href={`${EXPLORER}/tx/${txId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:text-indigo-200"
              >
                View transaction <ExternalLink className="h-3 w-3" />
              </a>
              <button
                onClick={onClose}
                className="mt-2 w-full rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* NFT summary */}
              <div className="mb-5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                  {nft.image && !imgError ? (
                    <img
                      src={nft.image}
                      alt={nft.name}
                      onError={() => setImgError(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white/25">
                      <ImageOff className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {nft.name}
                  </p>
                  <p className="truncate font-mono text-xs text-white/35">
                    {nft.assetId.slice(0, 10)}…{nft.assetId.slice(-6)}
                  </p>
                </div>
              </div>

              {/* Category — REQUIRED (front-end only) */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-white/60">
                  Category <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {NFT_CATEGORIES.map((c) => {
                    const active = category === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCategory(c.id);
                          setTouchedCategory(true);
                        }}
                        className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-medium transition ${
                          active
                            ? "border-indigo-500/60 bg-indigo-500/15 text-white"
                            : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white/80"
                        }`}
                      >
                        <span className="text-base leading-none">{c.emoji}</span>
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
                {touchedCategory && !categoryValid && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-400">
                    <AlertCircle className="h-3 w-3" />
                    Please select a category to continue.
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-white/60">
                  Price (KSS) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.00000001"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className={`w-full rounded-xl border bg-white/[0.03] px-3.5 py-2.5 pr-14 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-indigo-500/50 ${
                      price && !priceValid ? "border-rose-500/50" : "border-white/10"
                    }`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-white/40">
                    KSS
                  </span>
                </div>
              </div>

              {/* Royalty */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-white/60">
                  Creator Royalty (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max={MAX_ROYALTY_PCT}
                    step="0.5"
                    value={royalty}
                    onChange={(e) => setRoyalty(e.target.value)}
                    className={`w-full rounded-xl border bg-white/[0.03] px-3.5 py-2.5 pr-10 text-sm text-white outline-none transition focus:border-indigo-500/50 ${
                      royalty && !royaltyValid
                        ? "border-rose-500/50"
                        : "border-white/10"
                    }`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-white/40">
                    %
                  </span>
                </div>
                <p
                  className={`mt-1 text-xs ${
                    royalty && !royaltyValid ? "text-rose-400" : "text-white/30"
                  }`}
                >
                  Max {MAX_ROYALTY_PCT}% · paid to creator on each resale
                </p>
              </div>

              {/* Breakdown */}
              {priceValid && (
                <div className="mb-4 space-y-1.5 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs">
                  <div className="flex justify-between text-white/40">
                    <span>Marketplace fee (2%)</span>
                    <span>-{feeKss.toFixed(4)} KSS</span>
                  </div>
                  <div className="flex justify-between text-white/40">
                    <span>Creator royalty ({royaltyNum || 0}%)</span>
                    <span>-{royaltyKss.toFixed(4)} KSS</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-1.5 font-medium text-white">
                    <span>You receive</span>
                    <span>{netKss.toFixed(4)} KSS</span>
                  </div>
                </div>
              )}

              <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/15 bg-amber-500/[0.07] p-3 text-xs text-amber-300/80">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Listing transfers your NFT into the marketplace escrow contract
                until it sells or you cancel.
              </div>

              {status === "error" && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              <button
                onClick={handleList}
                disabled={!canList}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {status === "listing" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Listing…
                  </>
                ) : (
                  <>
                    <Tag className="h-4 w-4" />
                    Confirm Listing
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
