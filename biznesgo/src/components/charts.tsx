"use client";

import { useRef, useState } from "react";
import { compact, fmt } from "@/lib/format";

export type SeriesPoint = { label: string; a: number; b: number };

export function DualLineChart({
  data,
  aLabel = "Savdo",
  bLabel = "Kirim",
  height = 220,
}: {
  data: SeriesPoint[];
  aLabel?: string;
  bLabel?: string;
  height?: number;
}) {
  const W = 660;
  const H = height;
  const padL = 46;
  const padR = 12;
  const padT = 16;
  const padB = 26;
  const iw = W - padL - padR;
  const ih = H - padT - padB;
  const max = Math.max(1, ...data.map((d) => Math.max(d.a, d.b)));
  const top = max * 1.12;
  const x = (i: number) =>
    padL + (data.length <= 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v: number) => padT + ih - (v / top) * ih;
  const line = (key: "a" | "b") =>
    data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(" ");

  const areaA =
    data.length > 1
      ? `${line("a")} L${x(data.length - 1).toFixed(1)},${(padT + ih).toFixed(1)} L${x(0).toFixed(1)},${(
          padT + ih
        ).toFixed(1)} Z`
      : "";

  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement | null>(null);

  const onMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || data.length === 0) return;
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const ratio = (px - padL) / iw;
    const i = Math.round(ratio * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };

  const ticks = 3;
  const labelEvery = Math.max(1, Math.ceil(data.length / 7));

  return (
    <div className="relative w-full">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full select-none"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="appleGradA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1d1d1f" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#1d1d1f" stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const v = (top / ticks) * i;
          return (
            <g key={i}>
              <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="#f0f0f2" strokeWidth="1" />
              <text x={padL - 8} y={y(v) + 3.5} textAnchor="end" fontSize="10" fill="#a1a1a6" fontFamily="system-ui">
                {compact(v)}
              </text>
            </g>
          );
        })}

        {data.map((d, i) =>
          i % labelEvery === 0 ? (
            <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="#86868b" fontFamily="system-ui">
              {d.label}
            </text>
          ) : null
        )}

        {areaA && <path d={areaA} fill="url(#appleGradA)" />}
        <path d={line("b")} fill="none" stroke="#d2d2d7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={line("a")} fill="none" stroke="#1d1d1f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

        {hover !== null && data[hover] && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + ih} stroke="#d2d2d7" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(data[hover].a)} r="4" fill="#1d1d1f" stroke="#ffffff" strokeWidth="2" />
            <circle cx={x(hover)} cy={y(data[hover].b)} r="4" fill="#86868b" stroke="#ffffff" strokeWidth="2" />
          </g>
        )}
      </svg>

      {hover !== null && data[hover] && (
        <div
          className="pointer-events-none absolute top-0 z-10 rounded-xl border border-black/5 bg-white/95 px-3 py-2 text-xs shadow-md backdrop-blur-sm"
          style={{
            left: `${(x(hover) / W) * 100}%`,
            transform: x(hover) > W * 0.62 ? "translateX(-106%)" : "translateX(8px)",
          }}
        >
          <div className="font-semibold text-[#1d1d1f] mb-1">{data[hover].label}</div>
          <div className="flex items-center gap-1.5 text-[#1d1d1f]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1d1d1f]" /> {aLabel}: {fmt(data[hover].a)}
          </div>
          <div className="flex items-center gap-1.5 text-[#86868b]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#86868b]" /> {bLabel}: {fmt(data[hover].b)}
          </div>
        </div>
      )}
    </div>
  );
}

export function DonutChart({
  data,
  centerLabel,
  centerValue,
}: {
  data: { label: string; value: number; color: string }[];
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 54;
  const C = 2 * Math.PI * r;
  let acc = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
      <div className="relative h-[140px] w-[140px] shrink-0">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" stroke="#f5f5f7" strokeWidth="14" />
          {total > 0 &&
            data.map((d, i) => {
              const frac = d.value / total;
              const dash = frac * C;
              const off = -acc * C;
              acc += frac;
              return (
                <circle
                  key={i}
                  cx="70"
                  cy="70"
                  r={r}
                  fill="none"
                  stroke={d.color}
                  strokeWidth="14"
                  strokeDasharray={`${Math.max(0, dash - 1)} ${C - Math.max(0, dash - 1)}`}
                  strokeDashoffset={off}
                />
              );
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-base font-semibold text-[#1d1d1f] tracking-tight">{centerValue}</div>
          <div className="text-[10px] text-[#86868b]">{centerLabel}</div>
        </div>
      </div>

      <ul className="w-full sm:w-auto flex-1 space-y-1.5">
        {data.map((d, i) => (
          <li key={i} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-2 text-[#424245]">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
              {d.label}
            </span>
            <span className="font-mono font-medium text-[#1d1d1f]">
              {total ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HBarList({
  data,
  format,
}: {
  data: { label: string; value: number; sub?: string }[];
  color?: string;
  format?: (v: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-3">
      {data.map((d, i) => (
        <li key={i}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
            <span className="truncate text-[#1d1d1f]">{d.label}</span>
            <span className="shrink-0 font-mono text-[#1d1d1f]">
              {format ? format(d.value) : d.value}
              {d.sub && <span className="ml-1 text-[10px] text-[#86868b]">{d.sub}</span>}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#f5f5f7]">
            <div
              className="h-full rounded-full bg-[#1d1d1f] transition-all duration-500"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
