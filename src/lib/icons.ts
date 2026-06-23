// src/lib/icons.ts
// Self-contained SVG icon set with zero external dependencies and no JSX.
//
// Notes:
//  - This file has a .ts extension, so it must NOT contain JSX. We build every
//    icon with React.createElement, which is valid plain TypeScript.
//  - Do NOT write package names or backticks in comments here. A build-time
//    import scanner reads this file and can mistake quoted/backticked tokens in
//    comments for real imports, then try to install them and break the shell.
//  - Public API: every export is a component accepting an optional className
//    and any SVG props, and inherits color via stroke set to currentColor.

import { createElement, type ReactNode, type SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & { className?: string };

const base: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function svg(children: ReactNode[]) {
  return (props: IconProps) =>
    createElement("svg", { ...base, ...props }, ...children);
}

const el = (tag: string, attrs: Record<string, unknown>) =>
  createElement(tag, { key: JSON.stringify(attrs), ...attrs });

/* Wallet dashboard */
export const Copy = svg([
  el("rect", { width: 14, height: 14, x: 8, y: 8, rx: 2, ry: 2 }),
  el("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }),
]);

export const Check = svg([el("polyline", { points: "20 6 9 17 4 12" })]);

export const Wallet = svg([
  el("path", {
    d: "M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1",
  }),
  el("path", { d: "M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" }),
]);

export const Shield = svg([
  el("path", {
    d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
  }),
]);

/* Recent transactions */
export const ArrowDownLeft = svg([
  el("line", { x1: 17, y1: 7, x2: 7, y2: 17 }),
  el("polyline", { points: "17 17 7 17 7 7" }),
]);

export const ArrowUpRight = svg([
  el("line", { x1: 7, y1: 17, x2: 17, y2: 7 }),
  el("polyline", { points: "7 7 17 7 17 17" }),
]);

export const Code2 = svg([
  el("path", { d: "m18 16 4-4-4-4" }),
  el("path", { d: "m6 8-4 4 4 4" }),
  el("path", { d: "m14.5 4-5 16" }),
]);

export const ExternalLink = svg([
  el("path", { d: "M15 3h6v6" }),
  el("path", { d: "M10 14 21 3" }),
  el("path", {
    d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
  }),
]);

export const RefreshCw = svg([
  el("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }),
  el("path", { d: "M21 3v5h-5" }),
  el("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }),
  el("path", { d: "M8 16H3v5" }),
]);

export const Inbox = svg([
  el("polyline", { points: "22 12 16 12 14 15 10 15 8 12 2 12" }),
  el("path", {
    d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
  }),
]);

/* Common UI */
export const Search = svg([
  el("circle", { cx: 11, cy: 11, r: 8 }),
  el("path", { d: "m21 21-4.3-4.3" }),
]);

export const Menu = svg([
  el("line", { x1: 4, y1: 6, x2: 20, y2: 6 }),
  el("line", { x1: 4, y1: 12, x2: 20, y2: 12 }),
  el("line", { x1: 4, y1: 18, x2: 20, y2: 18 }),
]);

export const X = svg([
  el("path", { d: "M18 6 6 18" }),
  el("path", { d: "m6 6 12 12" }),
]);

export const ChevronRight = svg([el("path", { d: "m9 18 6-6-6-6" })]);

export const ChevronLeft = svg([el("path", { d: "m15 18-6-6 6-6" })]);

export const ChevronDown = svg([el("path", { d: "m6 9 6 6 6-6" })]);

export const Plus = svg([
  el("path", { d: "M5 12h14" }),
  el("path", { d: "M12 5v14" }),
]);

export const Send = svg([
  el("path", {
    d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",
  }),
  el("path", { d: "m21.854 2.147-10.94 10.939" }),
]);

export const ArrowLeft = svg([
  el("path", { d: "m12 19-7-7 7-7" }),
  el("path", { d: "M19 12H5" }),
]);

export const Loader2 = svg([
  el("path", { d: "M21 12a9 9 0 1 1-6.219-8.56" }),
]);

export const AlertCircle = svg([
  el("circle", { cx: 12, cy: 12, r: 10 }),
  el("line", { x1: 12, y1: 8, x2: 12, y2: 12 }),
  el("line", { x1: 12, y1: 16, x2: 12.01, y2: 16 }),
]);

export const Tag = svg([
  el("path", {
    d: "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z",
  }),
  el("circle", { cx: 7.5, cy: 7.5, r: 0.5, fill: "currentColor" }),
]);

export const ImageIcon = svg([
  el("rect", { width: 18, height: 18, x: 3, y: 3, rx: 2, ry: 2 }),
  el("circle", { cx: 9, cy: 9, r: 2 }),
  el("path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" }),
]);
