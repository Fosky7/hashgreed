// src/pages/CreateNft.tsx
import { useMemo, useState } from "react";
import {
  ImagePlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ImageOff,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useSession } from "@/lib/blockchain/kross/useSession";
import {
  mintNft,
  resolveImageUrl,
  isValidImageInput,
  type NftMetadata,
} from "@/lib/blockchain/kross/mintNft";

const EXPLORER = "https://krossexplorer.com";
const MAX_DESC = 800;

interface Attr {
  id: number;
  trait_type: string;
  value: string;
}

type Status = "idle" | "minting" | "success" | "error";

export default function CreateNft() {
  const { address, isConnected } = useSession();

  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [attributes, setAttributes] = useState<Attr[]>([]);
  const [attrSeq, setAttrSeq] = useState(0);

  const [imgError, setImgError] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [assetId, setAssetId] = useState("");

  const previewUrl = useMemo(() => resolveImageUrl(image), [image]);
  const imageValid = image === "" || isValidImageInput(image);
  const nameValid = name.trim().length >= 4 && name.trim().length <= 16;

  const canMint =
    isConnected &&
    nameValid &&
    isValidImageInput(image) &&
    status !== "minting";

  const addAttr = () => {
    setAttributes((a) => [...a, { id: attrSeq, trait_type: "", value: "" }]);
    setAttrSeq((n) => n + 1);
  };
  const updateAttr = (id: number, key: "trait_type" | "value", val: string) =>
    setAttributes((a) =>
      a.map((x) => (x.id === id ? { ...x, [key]: val } : x))
    );
  const removeAttr = (id: number) =>
    setAttributes((a) => a.filter((x) => x.id !== id));

  const resetForm = () => {
    setName("");
    setImage("");
    setDescription("");
    setExternalUrl("");
    setAttributes([]);
  };

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canMint) return;
    setStatus("minting");
    setMessage("");
    try {
      const cleanAttrs = attributes
        .map((a) => ({
          trait_type: a.trait_type.trim(),
          value: a.value.trim(),
        }))
        .filter((a) => a.trait_type && a.value);

      const meta: NftMetadata = {
        name: name.trim(),
        description: description.trim(),
        image: image.trim(),
        attributes: cleanAttrs.length ? cleanAttrs : undefined,
        externalUrl: externalUrl.trim() || undefined,
      };

      const res = await mintNft(meta);
      setAssetId(res.assetId);
      setStatus("success");
      setMessage(`"${res.name}" minted successfully!`);
      resetForm();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Minting failed.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 ring-1 ring-white/10">
          <Sparkles className="h-5 w-5 text-indigo-300" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Create NFT</h1>
          <p className="text-sm text-white/40">
            Mint a unique NFT on the Kross network
          </p>
        </div>
      </div>

      {!isConnected && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Connect your wallet to mint an NFT.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* ---------- Form ---------- */}
        <form
          onSubmit={handleMint}
          className="space-y-5 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 backdrop-blur-xl"
        >
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">
              Name <span className="text-rose-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome NFT"
              maxLength={16}
              className={`w-full rounded-xl border bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-indigo-500/50 focus:bg-white/[0.05] ${
                name && !nameValid ? "border-rose-500/50" : "border-white/10"
              }`}
            />
            <div className="mt-1 flex justify-between text-xs">
              <span className={name && !nameValid ? "text-rose-400" : "text-white/30"}>
                4–16 characters
              </span>
              <span className="text-white/30">{name.length}/16</span>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">
              Image URL or IPFS Link <span className="text-rose-400">*</span>
            </label>
            <input
              value={image}
              onChange={(e) => {
                setImage(e.target.value);
                setImgError(false);
              }}
              placeholder="https://… or ipfs://…"
              spellCheck={false}
              className={`w-full rounded-xl border bg-white/[0.03] px-3.5 py-2.5 font-mono text-sm text-white placeholder:text-white/25 outline-none transition focus:border-indigo-500/50 focus:bg-white/[0.05] ${
                !imageValid ? "border-rose-500/50" : "border-white/10"
              }`}
            />
            <p className={`mt-1 text-xs ${!imageValid ? "text-rose-400" : "text-white/30"}`}>
              {!imageValid
                ? "Must start with https:// or ipfs://"
                : "Paste a public image link — IPFS links are auto-resolved."}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESC))}
              placeholder="Describe your NFT, its story, and what makes it unique…"
              rows={4}
              className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-indigo-500/50 focus:bg-white/[0.05]"
            />
            <div className="mt-1 text-right text-xs text-white/30">
              {description.length}/{MAX_DESC}
            </div>
          </div>

          {/* External URL */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">
              External URL <span className="text-white/30">(optional)</span>
            </label>
            <input
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://yourproject.com"
              spellCheck={false}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-indigo-500/50 focus:bg-white/[0.05]"
            />
          </div>

          {/* Attributes / metadata */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium text-white/60">
                Attributes <span className="text-white/30">(metadata traits)</span>
              </label>
              <button
                type="button"
                onClick={addAttr}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/70 transition hover:bg-white/10"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>

            {attributes.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 px-3.5 py-3 text-center text-xs text-white/30">
                No attributes yet. Add traits like "Background: Blue".
              </p>
            ) : (
              <div className="space-y-2">
                {attributes.map((a) => (
                  <div key={a.id} className="flex items-center gap-2">
                    <input
                      value={a.trait_type}
                      onChange={(e) => updateAttr(a.id, "trait_type", e.target.value)}
                      placeholder="Trait"
                      className="w-1/2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-indigo-500/50"
                    />
                    <input
                      value={a.value}
                      onChange={(e) => updateAttr(a.id, "value", e.target.value)}
                      placeholder="Value"
                      className="w-1/2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-indigo-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttr(a.id)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/30 transition hover:bg-rose-500/10 hover:text-rose-400"
                      aria-label="Remove attribute"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status banners */}
          {status === "success" && (
            <a
              href={`${EXPLORER}/assets/${assetId}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300 transition hover:bg-emerald-500/15"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span className="flex-1">{message}</span>
              <ExternalLink className="h-3.5 w-3.5" />
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
            disabled={!canMint}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "minting" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Minting…
              </>
            ) : (
              <>
                <ImagePlus className="h-4 w-4" />
                Mint NFT
              </>
            )}
          </button>
          <p className="text-center text-xs text-white/30">
            Minting issues a non-divisible asset · network fee 1 KSS
          </p>
        </form>

        {/* ---------- Live preview ---------- */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-4 backdrop-blur-xl">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-white/40">
              Live Preview
            </p>

            {/* Image */}
            <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-white/10 bg-black/30">
              {previewUrl && !imgError ? (
                <img
                  src={previewUrl}
                  alt={name || "NFT preview"}
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/25">
                  {imgError ? (
                    <>
                      <ImageOff className="h-8 w-8" />
                      <span className="text-xs">Couldn't load image</span>
                    </>
                  ) : (
                    <>
                      <ImagePlus className="h-8 w-8" />
                      <span className="text-xs">Image preview</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Meta */}
            <div className="mt-4 space-y-2">
              <h3 className="truncate text-base font-semibold text-white">
                {name || "Untitled NFT"}
              </h3>
              {description ? (
                <p className="line-clamp-3 text-xs leading-relaxed text-white/50">
                  {description}
                </p>
              ) : (
                <p className="text-xs italic text-white/25">No description yet</p>
              )}

              {attributes.filter((a) => a.trait_type && a.value).length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {attributes
                    .filter((a) => a.trait_type && a.value)
                    .map((a) => (
                      <span
                        key={a.id}
                        className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/60"
                      >
                        <span className="text-white/40">{a.trait_type}:</span>{" "}
                        {a.value}
                      </span>
                    ))}
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-2 text-xs text-white/30">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                Kross Network · KSS
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
