'use client'

import type { PaletteGroup } from '@/lib/geo'

// ---------------------------------------------------------------------------
// Realistic-style metallic SVG thumbnails for the parts catalogue. Rendered
// with layered gradients so the galvanised-steel parts read like the 3D
// product shots in the approved design (Rohre · Bögen · Abzweiger · …).
// ---------------------------------------------------------------------------

function ThumbDefs() {
  return (
    <defs>
      {/* horizontal cylinder — shading runs across the tube height */}
      <linearGradient id="ctg-h" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f7f9fb" />
        <stop offset="0.28" stopColor="#dde3e9" />
        <stop offset="0.62" stopColor="#a8b1bc" />
        <stop offset="0.85" stopColor="#cdd4db" />
        <stop offset="1" stopColor="#e9edf1" />
      </linearGradient>
      {/* vertical cylinder — shading runs across the width */}
      <linearGradient id="ctg-v" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#f7f9fb" />
        <stop offset="0.28" stopColor="#dde3e9" />
        <stop offset="0.62" stopColor="#a8b1bc" />
        <stop offset="0.85" stopColor="#cdd4db" />
        <stop offset="1" stopColor="#e9edf1" />
      </linearGradient>
      {/* pipe opening seen at an angle */}
      <radialGradient id="ctg-open" cx="0.42" cy="0.4" r="0.75">
        <stop offset="0" stopColor="#6b7480" />
        <stop offset="0.62" stopColor="#454d59" />
        <stop offset="1" stopColor="#2e343d" />
      </radialGradient>
      {/* collector housing */}
      <linearGradient id="ctg-box" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f2f5f8" />
        <stop offset="0.6" stopColor="#d3dae1" />
        <stop offset="1" stopColor="#b9c2cc" />
      </linearGradient>
      <linearGradient id="ctg-steel-diag" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f2f5f8" />
        <stop offset="0.55" stopColor="#b6bfca" />
        <stop offset="1" stopColor="#dde3e9" />
      </linearGradient>
    </defs>
  )
}

const OUTLINE = '#69727e'

function Shadow({ cx = 50, cy = 68, rx = 30 }: { cx?: number; cy?: number; rx?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={4.5} fill="#0f172a" opacity={0.1} />
}

function PipeBody({ x, y, w, h, r = 0 }: { x: number; y: number; w: number; h: number; r?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={r} fill="url(#ctg-h)" stroke={OUTLINE} strokeWidth={1} />
      <rect x={x + 2} y={y + 2} width={w - 4} height={2.6} rx={1.3} fill="#ffffff" opacity={0.65} />
      <rect x={x + 2} y={y + h - 4} width={w - 4} height={1.6} rx={0.8} fill="#ffffff" opacity={0.25} />
    </g>
  )
}

function OpeningV({ cx, cy, ry, rx }: { cx: number; cy: number; ry: number; rx?: number }) {
  const rxv = rx ?? Math.max(2.4, ry * 0.34)
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rxv} ry={ry} fill="url(#ctg-open)" stroke={OUTLINE} strokeWidth={1} />
      <ellipse cx={cx} cy={cy} rx={rxv * 0.55} ry={ry * 0.6} fill="none" stroke="#8b95a2" strokeWidth={0.8} opacity={0.7} />
    </g>
  )
}

function FlangeV({ cx, cy, ry }: { cx: number; cy: number; ry: number }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={Math.max(2.6, ry * 0.42)} ry={ry + 1.6} fill="url(#ctg-v)" stroke={OUTLINE} strokeWidth={1} />
    </g>
  )
}

export function CategoryThumb({ kind, className }: { kind: PaletteGroup; className?: string }) {
  return (
    <svg viewBox="0 0 100 76" className={className} aria-hidden>
      <ThumbDefs />
      {kind === 'PIPE' && (
        <g transform="rotate(-12 50 40)">
          <Shadow cx={50} cy={66} rx={32} />
          <PipeBody x={17} y={30} w={66} h={21} r={2} />
          {/* right end — opening */}
          <ellipse cx={83} cy={40.5} rx={4.6} ry={10.5} fill="url(#ctg-v)" stroke={OUTLINE} strokeWidth={1} />
          <OpeningV cx={82} cy={40.5} ry={8.4} />
          {/* left end — angled rim */}
          <ellipse cx={17} cy={40.5} rx={4.6} ry={10.5} fill="url(#ctg-v)" stroke={OUTLINE} strokeWidth={1} />
          <OpeningV cx={18} cy={40.5} ry={8.4} />
        </g>
      )}

      {kind === 'BEND' && (
        <g>
          <Shadow cx={50} cy={70} rx={30} />
          {/* vertical leg */}
          <path d="M 32 62 L 32 42" stroke="url(#ctg-h)" strokeWidth={21} fill="none" />
          <path d="M 32 62 L 32 42" stroke={OUTLINE} strokeWidth={22.4} fill="none" opacity={0.35} />
          <path d="M 21.8 62 L 21.8 44" stroke="#f2f5f8" strokeWidth={1.4} opacity={0.9} />
          {/* curve */}
          <path d="M 32 42 Q 32 26 48 26" stroke="url(#ctg-h)" strokeWidth={21} fill="none" />
          {/* horizontal leg */}
          <path d="M 44 26 L 68 26" stroke="url(#ctg-h)" strokeWidth={21} fill="none" />
          <path d="M 44 36.5 L 68 36.5" stroke={OUTLINE} strokeWidth={1} opacity={0.5} />
          <path d="M 44 16 L 68 16" stroke="#f2f5f8" strokeWidth={2.4} opacity={0.85} />
          <rect x={46} y={18.4} width={20} height={2.4} rx={1.2} fill="#ffffff" opacity={0.6} />
          {/* flange + opening at the right end */}
          <FlangeV cx={71} cy={26} ry={10.5} />
          <OpeningV cx={78} cy={26} ry={8.6} />
          {/* bottom opening */}
          <ellipse cx={32} cy={62} rx={10.5} ry={4.4} fill="url(#ctg-open)" stroke={OUTLINE} strokeWidth={1} />
          <ellipse cx={32} cy={62} rx={6} ry={2.4} fill="none" stroke="#8b95a2" strokeWidth={0.8} opacity={0.7} />
        </g>
      )}

      {kind === 'BRANCH' && (
        <g transform="rotate(-6 50 40)">
          <Shadow cx={50} cy={66} rx={32} />
          {/* main run */}
          <path d="M 16 46 L 62 46" stroke="url(#ctg-h)" strokeWidth={20} fill="none" />
          <path d="M 16 37 L 58 37" stroke="#f2f5f8" strokeWidth={2.2} opacity={0.85} />
          <path d="M 16 55.5 L 62 55.5" stroke={OUTLINE} strokeWidth={1} opacity={0.5} />
          {/* branch tube */}
          <g transform="rotate(-38 52 42)">
            <path d="M 48 42 L 76 42" stroke="url(#ctg-h)" strokeWidth={16} fill="none" />
            <path d="M 48 35.5 L 74 35.5" stroke="#f2f5f8" strokeWidth={1.8} opacity={0.85} />
            <FlangeV cx={80} cy={42} ry={8} />
            <OpeningV cx={86} cy={42} ry={6.6} />
          </g>
          {/* openings */}
          <ellipse cx={16} cy={46} rx={4.4} ry={10} fill="url(#ctg-open)" stroke={OUTLINE} strokeWidth={1} />
          <ellipse cx={62} cy={46} rx={4.4} ry={10} fill="url(#ctg-v)" stroke={OUTLINE} strokeWidth={1} />
          <OpeningV cx={63} cy={46} ry={8} />
        </g>
      )}

      {kind === 'REDUCER' && (
        <g transform="rotate(-8 50 40)">
          <Shadow cx={50} cy={64} rx={32} />
          {/* cone body */}
          <path d="M 18 26 L 74 33 L 74 51 L 18 58 Z" fill="url(#ctg-h)" stroke={OUTLINE} strokeWidth={1} strokeLinejoin="round" />
          <path d="M 22 33 L 74 38.6" stroke="#ffffff" strokeWidth={2.4} opacity={0.55} />
          <path d="M 18 26 L 74 33" stroke="#f2f5f8" strokeWidth={1.4} opacity={0.9} />
          {/* big opening left */}
          <ellipse cx={18} cy={42} rx={4.6} ry={16} fill="url(#ctg-open)" stroke={OUTLINE} strokeWidth={1} />
          <ellipse cx={18.6} cy={42} rx={2.6} ry={11} fill="none" stroke="#8b95a2" strokeWidth={0.9} opacity={0.7} />
          {/* small opening right */}
          <ellipse cx={74} cy={42} rx={3.8} ry={9} fill="url(#ctg-v)" stroke={OUTLINE} strokeWidth={1} />
          <OpeningV cx={75} cy={42} ry={7.2} />
        </g>
      )}

      {kind === 'GATE' && (
        <g>
          <Shadow cx={48} cy={68} rx={24} />
          {/* vertical body */}
          <path d="M 42 16 L 42 58" stroke="url(#ctg-v)" strokeWidth={20} fill="none" />
          <path d="M 33 16 L 33 58" stroke="#f2f5f8" strokeWidth={2} opacity={0.85} />
          <path d="M 51.5 16 L 51.5 58" stroke={OUTLINE} strokeWidth={1} opacity={0.5} />
          {/* top + bottom flanges */}
          <rect x={31} y={11} width={22} height={6} rx={1.6} fill="url(#ctg-h)" stroke={OUTLINE} strokeWidth={1} />
          <rect x={31} y={56} width={22} height={6} rx={1.6} fill="url(#ctg-h)" stroke={OUTLINE} strokeWidth={1} />
          <OpeningV cx={42} cy={13.4} ry={3} rx={9.4} />
          {/* red lever handle */}
          <g>
            <rect x={50} y={30} width={10} height={7} rx={1.4} fill="#cfd6dd" stroke={OUTLINE} strokeWidth={0.9} />
            <path d="M 60 33.5 L 76 30" stroke="#c22525" strokeWidth={4.4} strokeLinecap="round" />
            <path d="M 60 33.5 L 76 30" stroke="#e34b4b" strokeWidth={2} strokeLinecap="round" />
            <circle cx={77.6} cy={29.7} r={3.4} fill="#b91c1c" stroke="#7f1212" strokeWidth={1} />
            <circle cx={76.6} cy={28.6} r={1.1} fill="#f07b7b" />
          </g>
          {/* gate slot */}
          <rect x={40} y={24} width={4} height={26} rx={1} fill="#59626d" opacity={0.55} />
        </g>
      )}

      {kind === 'CONNECT' && (
        <g>
          <Shadow cx={50} cy={64} rx={28} />
          {/* socket coupling — two stepped rings */}
          <ellipse cx={50} cy={40} rx={30} ry={17} fill="url(#ctg-h)" stroke={OUTLINE} strokeWidth={1} />
          <ellipse cx={50} cy={38.6} rx={30} ry={15.4} fill="url(#ctg-steel-diag)" opacity={0.55} />
          <ellipse cx={50} cy={40} rx={21} ry={11.4} fill="url(#ctg-h)" stroke={OUTLINE} strokeWidth={1} />
          <ellipse cx={50} cy={40} rx={13.5} ry={7.2} fill="url(#ctg-open)" stroke={OUTLINE} strokeWidth={1} />
          <ellipse cx={50} cy={40} rx={9} ry={4.6} fill="none" stroke="#8b95a2" strokeWidth={0.9} opacity={0.75} />
          <path d="M 26 32 A 26 13 0 0 1 74 32" stroke="#ffffff" strokeWidth={2.2} fill="none" opacity={0.55} />
        </g>
      )}

      {kind === 'ACCESSORY' && (
        <g transform="rotate(-14 50 40)">
          <Shadow cx={50} cy={62} rx={30} />
          {/* corrugated flex hose */}
          {Array.from({ length: 7 }).map((_, i) => (
            <g key={i}>
              <rect x={16 + i * 9.6} y={28} width={8.4} height={22} rx={3.4} fill="url(#ctg-h)" stroke={OUTLINE} strokeWidth={0.9} />
              <rect x={17.4 + i * 9.6} y={30} width={5.6} height={2} rx={1} fill="#ffffff" opacity={0.6} />
            </g>
          ))}
          <rect x={14} y={30.4} width={72} height={3.2} rx={1.6} fill="#9aa3ae" opacity={0.4} />
          <rect x={14} y={44.4} width={72} height={3.2} rx={1.6} fill="#69727e" opacity={0.35} />
          <ellipse cx={85.4} cy={39} rx={2.6} ry={10.6} fill="url(#ctg-open)" stroke={OUTLINE} strokeWidth={0.9} />
        </g>
      )}

      {kind === 'UNIT' && (
        <g>
          <Shadow cx={50} cy={68} rx={30} />
          {/* collector housing in light perspective */}
          <path d="M 26 22 L 62 22 L 70 16 L 34 16 Z" fill="#eef2f6" stroke={OUTLINE} strokeWidth={1} />
          <rect x={26} y={22} width={36} height={38} fill="url(#ctg-box)" stroke={OUTLINE} strokeWidth={1} />
          <path d="M 62 22 L 70 16 L 70 52 L 62 60 Z" fill="#c3cdd6" stroke={OUTLINE} strokeWidth={1} />
          {/* filter cartridges */}
          <rect x={30} y={27} width={12} height={22} rx={2} fill="#f6f8fa" stroke="#7c8592" strokeWidth={1} />
          <rect x={45} y={27} width={12} height={22} rx={2} fill="#f6f8fa" stroke="#7c8592" strokeWidth={1} />
          <path d="M 30 38 h 12 M 45 38 h 12" stroke="#aeb8c2" strokeWidth={0.9} />
          {/* hopper + bin */}
          <path d="M 30 60 L 58 60 L 54 68 L 34 68 Z" fill="#b6c0ca" stroke={OUTLINE} strokeWidth={1} />
          {/* inlet stub */}
          <ellipse cx={26} cy={30} rx={4.4} ry={6.4} fill="url(#ctg-open)" stroke={OUTLINE} strokeWidth={1} />
        </g>
      )}

      {kind === '__machines' && (
        <g>
          <Shadow cx={50} cy={66} rx={30} />
          <path d="M 24 30 L 62 30 L 72 22 L 34 22 Z" fill="#eef2f6" stroke={OUTLINE} strokeWidth={1} />
          <rect x={24} y={30} width={38} height={28} fill="url(#ctg-box)" stroke={OUTLINE} strokeWidth={1} />
          <path d="M 62 30 L 72 22 L 72 50 L 62 58 Z" fill="#c3cdd6" stroke={OUTLINE} strokeWidth={1} />
          <circle cx={43} cy={44} r={9} fill="#f6f8fa" stroke="#7c8592" strokeWidth={1.2} />
          <circle cx={43} cy={44} r={3.4} fill="none" stroke="#aeb8c2" strokeWidth={1} />
          <path d="M 30 32 v 24 M 56 32 v 24" stroke="#aeb8c2" strokeWidth={0.9} />
          <rect x={26} y={24} width={30} height={3} rx={1.5} fill="#ffffff" opacity={0.6} />
        </g>
      )}
    </svg>
  )
}
