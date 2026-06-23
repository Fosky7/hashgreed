// src/lib/icons.ts
// Central re-export of the lucide-react icons used across the app.
//
// Why this file exists:
//  - package.json is AUTO-GENERATED from the project's static imports, so this
//    static re-export guarantees `lucide-react` is detected and added as a real
//    bundled dependency.
//  - lucide-react is a plain React component library with NO Node-global
//    initialization, so it is safe to import statically and MUST be bundled
//    normally (it is NOT a CDN external like the Waves SDK).
//
// Import icons from "@/lib/icons" throughout the app for consistency.
export {
  // Wallet dashboard
  Copy,
  Check,
  Wallet,
  Shield,
  // Recent transactions
  ArrowDownLeft,
  ArrowUpRight,
  Code2,
  ExternalLink,
  RefreshCw,
  Inbox,
  // Common UI
  Search,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Plus,
  Send,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Tag,
  Image as ImageIcon,
} from "lucide-react";
