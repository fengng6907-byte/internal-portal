'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Signal,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabId = 'launch-radar' | 'kol-radar';

interface LaunchRecord {
  timestamp?: string;
  title?: string;
  url?: string;
  url_hash?: string;
  pub_date?: string;
  status?: string;
  source?: string;
  brand_hint?: string;
  market?: string;
  distributor_point?: string;
  festive_tag?: string;
  [key: string]: string | undefined;
}

interface KolRecord {
  id: string;
  handle: string;
  platform: string;
  follower_count: number;
  tags: string[];
  recent_post: string;
  signal_score: number;
  brand_hint: string;
  detected_at: string;
  post_url: string;
  status: string;
  market?: string;
  distributor_point?: string;
}

// ---------------------------------------------------------------------------
// Fallback demo data (rendered when Google Sheets credentials are absent)
// ---------------------------------------------------------------------------

const DEMO_LAUNCHES: LaunchRecord[] = [
  {
    timestamp: '2026-05-25 08:12:00',
    title: 'Meiji launches new matcha soft serve collab exclusive to FairPrice Finest',
    url: '#',
    url_hash: 'demo_a1b2',
    pub_date: '2026-05-25',
    status: 'New',
    source: 'Scraper',
    brand_hint: '',
    market: 'Singapore',
    distributor_point: 'Auric Pacific',
    festive_tag: 'None',
  },
  {
    timestamp: '2026-05-24 14:30:00',
    title: 'Cold Storage introduces premium Korean snack aisle — 12 new SKUs Q3',
    url: '#',
    url_hash: 'demo_c3d4',
    pub_date: '2026-05-24',
    status: 'New',
    source: 'Scraper',
    brand_hint: 'Korean snack import',
    market: 'Singapore',
    distributor_point: 'DKSH',
    festive_tag: 'None',
  },
  {
    timestamp: '2026-05-24 10:05:00',
    title: '[KOL Signal] @nasilemakking_sg — New imported ramen line set for Sheng Siong shelves Q3 2026',
    url: '#',
    url_hash: 'demo_kol4',
    pub_date: '2026-05-24',
    status: 'KOL Lead',
    source: 'YouTube / @nasilemakking_sg',
    brand_hint: 'Japanese ramen import — Sheng Siong',
    market: 'Singapore',
    distributor_point: 'DKSH',
    festive_tag: 'None',
  },
  {
    timestamp: '2026-05-23 09:00:00',
    title: 'Marketing Interactive: New FMCG beverage brand targets NTUC FairPrice exclusive listing',
    url: '#',
    url_hash: 'demo_e5f6',
    pub_date: '2026-05-23',
    status: 'Contacted',
    source: 'Scraper',
    brand_hint: '',
    market: 'Singapore',
    distributor_point: 'Direct',
    festive_tag: 'None',
  },
  {
    timestamp: '2026-05-25 07:45:00',
    title: 'New Japanese snack brand lands Jaya Grocer Malaysia exclusive — 6 SKU launch',
    url: '#',
    url_hash: 'demo_my01',
    pub_date: '2026-05-25',
    status: 'New',
    source: 'Scraper',
    brand_hint: 'Japanese snack — Jaya Grocer MY',
    market: 'Malaysia',
    distributor_point: 'DKSH',
    festive_tag: 'None',
  },
];

const DEMO_KOL: KolRecord[] = [
  {
    id: 'kol_001',
    handle: '@sgfoodiequeenie',
    platform: 'Instagram',
    follower_count: 87400,
    tags: ['#prhaulsg', '#sgfoodie', '#sgfood'],
    recent_post:
      'Unboxing this mystery PR haul from a major FMCG brand 👀 Something new at FairPrice soon!',
    signal_score: 92,
    brand_hint: 'FairPrice / Unknown FMCG',
    detected_at: '2026-05-24T14:32:00Z',
    post_url: '#',
    status: 'New',
  },
  {
    id: 'kol_002',
    handle: '@mediakitsg_trev',
    platform: 'TikTok',
    follower_count: 124000,
    tags: ['#mediakitsg', '#sgfoodie', '#newlaunch'],
    recent_post:
      'Got the most insane media kit from a snack brand launching next month in SG 🔥 #mediakitsg',
    signal_score: 88,
    brand_hint: 'Snack category — Cold Storage likely distribution',
    detected_at: '2026-05-24T10:15:00Z',
    post_url: '#',
    status: 'New',
  },
  {
    id: 'kol_003',
    handle: '@unboxwithpriya',
    platform: 'Instagram',
    follower_count: 52100,
    tags: ['#prhaulsg', '#sgbeauty', '#sgfoodie'],
    recent_post:
      'PR haul from 3 brands this week — the FMCG one smells incredible, limited edition collab incoming 👁',
    signal_score: 76,
    brand_hint: 'Beauty x FMCG crossover — limited SKU',
    detected_at: '2026-05-23T20:45:00Z',
    post_url: '#',
    status: 'New',
  },
  {
    id: 'kol_004',
    handle: '@nasilemakking_sg',
    platform: 'YouTube',
    follower_count: 203000,
    tags: ['#sgfoodie', '#unboxing', '#singaporefood'],
    recent_post:
      'Full unboxing: New imported ramen line set to hit Sheng Siong shelves Q3 2026 — is it worth it?',
    signal_score: 95,
    brand_hint: 'Japanese ramen import — Sheng Siong',
    detected_at: '2026-05-25T08:00:00Z',
    post_url: '#',
    status: 'New',
  },
  {
    id: 'kol_005',
    handle: '@chillaxwithchels',
    platform: 'TikTok',
    follower_count: 39800,
    tags: ['#prhaulsg', '#mediakitsg'],
    recent_post:
      "Okay the new beverage PR I got is WILD — this is going to be huge at NTUC. No more details yet 🤫",
    signal_score: 83,
    brand_hint: 'Beverage category — NTUC FairPrice',
    detected_at: '2026-05-25T06:30:00Z',
    post_url: '#',
    status: 'New',
  },
];

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function fmtFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

const SIGNAL_TEXT: Record<string, string> = {
  high: 'text-emerald-400',
  mid: 'text-amber-400',
  low: 'text-zinc-400',
};
const SIGNAL_RING: Record<string, string> = {
  high: 'bg-emerald-400/10 border-emerald-400/30',
  mid: 'bg-amber-400/10 border-amber-400/30',
  low: 'bg-zinc-800 border-zinc-700',
};
function signalTier(score: number) {
  return score >= 90 ? 'high' : score >= 75 ? 'mid' : 'low';
}

const STATUS_PILL: Record<string, string> = {
  New: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
  'KOL Lead': 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  Contacted: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  Converted: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
};

const PLATFORM_EMOJI: Record<string, string> = {
  Instagram: '📸',
  TikTok: '🎵',
  YouTube: '▶️',
};

// ---------------------------------------------------------------------------
// Brand Story Tray — horizontal scrollable brand avatars with IG story rings
// ---------------------------------------------------------------------------

const FEATURED_BRANDS = [
  { name: 'Nestlé',     initial: 'N',  color: '#a16207' },
  { name: 'Unilever',   initial: 'U',  color: '#1d4ed8' },
  { name: 'F&N',        initial: 'F',  color: '#c2410c' },
  { name: 'Oatbedient', initial: 'Oa', color: '#92400e' },
  { name: 'Meiji',      initial: 'M',  color: '#9d174d' },
  { name: 'Mondelez',   initial: 'Mz', color: '#6b21a8' },
  { name: 'P&G',        initial: 'P',  color: '#0369a1' },
  { name: 'Danone',     initial: 'D',  color: '#3730a3' },
];

const STORY_GRADIENT = 'linear-gradient(135deg, #FF007A, #FF6B00, #FFC800)';

function BrandStoryTray({
  launches,
  kolData,
  activeBrand,
  onSelect,
}: {
  launches: LaunchRecord[];
  kolData: KolRecord[];
  activeBrand: string | null;
  onSelect: (brand: string | null) => void;
}) {
  function hasActiveSignal(brandName: string): boolean {
    const bn = brandName.toLowerCase();
    return (
      launches.some(
        (l) =>
          (l.brand_hint?.toLowerCase().includes(bn) || l.title?.toLowerCase().includes(bn)) &&
          (l.status === 'New' || (l.festive_tag && l.festive_tag !== 'None')),
      ) ||
      kolData.some((k) => k.brand_hint.toLowerCase().includes(bn) && k.status === 'New')
    );
  }

  return (
    <div className="shrink-0 border-b border-zinc-800/60 px-5">
      <div className="flex overflow-x-auto gap-5 py-4 scrollbar-none">
        {/* "All" node */}
        <button
          onClick={() => onSelect(null)}
          className="flex flex-col items-center gap-1.5 shrink-0"
        >
          <div
            className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-lg"
            style={
              activeBrand === null
                ? { boxShadow: '0 0 0 2px #e4e4e7' }
                : { boxShadow: '0 0 0 1.5px #3f3f46' }
            }
          >
            🌐
          </div>
          <span className={`text-[10px] ${activeBrand === null ? 'text-zinc-200' : 'text-zinc-600'}`}>
            All
          </span>
        </button>

        {FEATURED_BRANDS.map((brand) => {
          const active = hasActiveSignal(brand.name);
          const selected = activeBrand === brand.name;
          return (
            <button
              key={brand.name}
              onClick={() => onSelect(selected ? null : brand.name)}
              className="flex flex-col items-center gap-1.5 shrink-0"
            >
              {/* Gradient ring wrapper */}
              <div
                className="w-14 h-14 rounded-full"
                style={
                  active && !selected
                    ? { background: STORY_GRADIENT, padding: '2.5px' }
                    : selected
                    ? { border: '2px solid #e4e4e7', padding: '2px' }
                    : { border: '1.5px solid #3f3f46', padding: '2.5px' }
                }
              >
                <div
                  className="w-full h-full rounded-full flex items-center justify-center"
                  style={{ backgroundColor: brand.color }}
                >
                  <span className="text-white text-xs font-bold select-none">
                    {brand.initial}
                  </span>
                </div>
              </div>
              <span
                className={`text-[10px] max-w-[3.5rem] truncate ${
                  selected ? 'text-zinc-200' : 'text-zinc-600'
                }`}
              >
                {brand.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MetricCard
// ---------------------------------------------------------------------------

type Accent = 'emerald' | 'amber' | 'violet' | 'blue';

const ACCENT: Record<Accent, { text: string; bg: string; border: string }> = {
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  amber: { text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  violet: { text: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/20' },
  blue: { text: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
};

function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: Accent;
  sub?: string;
}) {
  const c = ACCENT[accent];
  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} p-4 flex items-start gap-3`}>
      <div className={`mt-0.5 p-1.5 rounded-md ${c.bg} border ${c.border} shrink-0`}>
        <Icon className={`w-4 h-4 ${c.text}`} />
      </div>
      <div>
        <p className="text-zinc-500 text-xs tracking-widest uppercase leading-none">{label}</p>
        <p className={`text-2xl font-bold ${c.text} mt-1 leading-none`}>{value}</p>
        {sub && <p className="text-zinc-600 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Launch Radar tab
// ---------------------------------------------------------------------------

function LaunchRadar({
  launches,
  loading,
  onRunScraper,
  scraping,
}: {
  launches: LaunchRecord[];
  loading: boolean;
  onRunScraper: () => void;
  scraping: boolean;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-5 shrink-0">
        <div>
          <h2 className="text-zinc-100 font-semibold text-sm tracking-wide">Launch Radar</h2>
          <p className="text-zinc-500 text-xs mt-0.5">
            Singapore FMCG signals — trade publications · RSS feeds
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/reports/download"
            download
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/25 hover:border-emerald-500/50 rounded-md text-xs text-emerald-300 transition-all"
          >
            <Download className="w-3 h-3" />
            📥 Export Regional Market Intel Report
          </a>
          <button
            onClick={onRunScraper}
            disabled={scraping}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-md text-xs text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {scraping ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            {scraping ? 'Scanning…' : 'Run Scraper'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-5 h-5 text-zinc-700 animate-spin" />
        </div>
      ) : launches.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-zinc-600 gap-2">
          <Database className="w-7 h-7" />
          <p className="text-sm">No leads yet — run the scraper to populate.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {launches.map((row, i) => {
            const initials = (row.source ?? 'U')
              .split(/[\s/·]+/)
              .filter(Boolean)
              .map((w: string) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();
            return (
              <div
                key={row.url_hash ?? i}
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden flex flex-col hover:border-zinc-700 transition-colors"
              >
                {/* Header */}
                <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
                  <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-zinc-300 text-xs font-medium truncate">{row.source ?? '—'}</p>
                    <p className="text-zinc-600 text-[10px]">{row.market ?? 'SG'} · {row.timestamp?.slice(0, 10)}</p>
                  </div>
                  <span className={`shrink-0 inline-block px-2 py-0.5 rounded text-[10px] ${STATUS_PILL[row.status ?? ''] ?? 'bg-zinc-800 text-zinc-400'}`}>
                    {row.status ?? '—'}
                  </span>
                </div>
                {/* Media frame */}
                <div className="w-full aspect-square relative overflow-hidden bg-zinc-950 border-y border-white/[0.05] flex items-center justify-center px-5">
                  <p className="text-zinc-200 text-sm leading-snug text-center line-clamp-5 font-medium">
                    {row.title}
                  </p>
                </div>
                {/* Caption metadata */}
                <div className="px-3 py-2.5 flex-1 flex flex-col gap-1.5">
                  {row.brand_hint && (
                    <p className="text-zinc-400 text-xs leading-snug">{row.brand_hint}</p>
                  )}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {row.distributor_point && row.distributor_point !== 'Unknown' && (
                      <span className="text-[10px] text-sky-400/70 bg-sky-400/5 border border-sky-400/10 rounded px-1.5 py-0.5">
                        {row.distributor_point}
                      </span>
                    )}
                    {row.festive_tag && row.festive_tag !== 'None' && (
                      <span className="text-[10px] text-amber-400/70 bg-amber-400/5 border border-amber-400/10 rounded px-1.5 py-0.5">
                        🎊 {row.festive_tag}
                      </span>
                    )}
                  </div>
                </div>
                {/* Action baseline */}
                <div className="flex items-center justify-between px-3 pb-3 pt-1 border-t border-zinc-800/60">
                  <p className="text-zinc-700 text-[10px]">{row.timestamp?.slice(0, 10)}</p>
                  {row.url && row.url !== '#' ? (
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Source
                    </a>
                  ) : (
                    <span className="text-zinc-800 text-xs">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KOL Radar tab
// ---------------------------------------------------------------------------

function KolRadar({
  kolData,
  loading,
  onConvert,
  convertingId,
  convertedIds,
  onIgnore,
  ignoredKolIds,
}: {
  kolData: KolRecord[];
  loading: boolean;
  onConvert: (id: string) => void;
  convertingId: string | null;
  convertedIds: Set<string>;
  onIgnore: (id: string) => void;
  ignoredKolIds: Set<string>;
}) {
  const visible = kolData.filter((k) => !ignoredKolIds.has(k.id));

  return (
    <div className="flex flex-col h-full">
      <div className="mb-5 shrink-0">
        <h2 className="text-zinc-100 font-semibold text-sm tracking-wide">KOL Unboxing Radar</h2>
        <p className="text-zinc-500 text-xs mt-0.5">
          High-signal creator activity ·{' '}
          <span className="text-violet-400/70">#prhaulsg</span> ·{' '}
          <span className="text-violet-400/70">#mediakitsg</span> ·{' '}
          <span className="text-violet-400/70">#sgfoodie</span>
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-5 h-5 text-zinc-700 animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-zinc-600 gap-2">
          <Users className="w-7 h-7" />
          <p className="text-sm">No KOL signals to display.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((kol) => {
            const converted = convertedIds.has(kol.id);
            const converting = convertingId === kol.id;
            const tier = signalTier(kol.signal_score);

            return (
              <div
                key={kol.id}
                className={`rounded-xl border overflow-hidden flex flex-col transition-colors ${
                  converted
                    ? 'border-emerald-500/25 bg-emerald-500/5'
                    : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                }`}
              >
                {/* Header */}
                <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
                  <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-sm shrink-0 leading-none">
                    {PLATFORM_EMOJI[kol.platform] ?? '🔗'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-zinc-300 text-xs font-medium truncate">{kol.handle}</p>
                    <p className="text-zinc-600 text-[10px]">
                      {kol.platform} · {fmtFollowers(kol.follower_count)} followers
                    </p>
                  </div>
                  <div className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold ${SIGNAL_RING[tier]}`}>
                    <Signal className={`w-2.5 h-2.5 ${SIGNAL_TEXT[tier]}`} />
                    <span className={SIGNAL_TEXT[tier]}>{kol.signal_score}</span>
                  </div>
                </div>

                {/* Media frame */}
                <div className="w-full aspect-square relative overflow-hidden bg-zinc-950 border-y border-white/[0.05] flex items-center justify-center px-5">
                  <p className="text-zinc-300 text-sm leading-relaxed text-center italic line-clamp-6">
                    &ldquo;{kol.recent_post}&rdquo;
                  </p>
                </div>

                {/* Caption metadata */}
                <div className="px-3 py-2.5 flex-1 flex flex-col gap-1.5">
                  <div className="flex items-start gap-1.5">
                    <Zap className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-amber-300/75 text-xs leading-snug">{kol.brand_hint}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {kol.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] text-violet-400/60 bg-violet-400/5 border border-violet-400/10 rounded px-1 py-0.5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {kol.distributor_point && kol.distributor_point !== 'Unknown' && (
                    <span className="self-start text-[10px] text-sky-400/70 bg-sky-400/5 border border-sky-400/10 rounded px-1.5 py-0.5">
                      {kol.distributor_point}
                    </span>
                  )}
                </div>

                {/* Action baseline */}
                <div className="flex items-center justify-between px-3 pb-3 pt-1 border-t border-zinc-800/60">
                  <p className="text-zinc-700 text-[10px]">
                    {new Date(kol.detected_at).toLocaleString('en-SG', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {converted ? (
                    <div className="flex items-center gap-1 text-emerald-400 text-xs">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Converted</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onIgnore(kol.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 text-xs transition-all"
                      >
                        ❌ Ignore
                      </button>
                      <button
                        onClick={() => onConvert(kol.id)}
                        disabled={!!convertingId}
                        className="flex items-center gap-1.5 px-2 py-1 bg-violet-600/15 hover:bg-violet-600/25 border border-violet-500/25 hover:border-violet-500/50 rounded text-violet-300 text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        {converting ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          '🚀'
                        )} Convert
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard — root page
// ---------------------------------------------------------------------------

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: 'launch-radar', label: 'Launch Radar', emoji: '🚀' },
  { id: 'kol-radar', label: 'KOL Radar', emoji: '📱' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('launch-radar');
  const [launches, setLaunches] = useState<LaunchRecord[]>([]);
  const [kolData, setKolData] = useState<KolRecord[]>([]);
  const [loadingLaunches, setLoadingLaunches] = useState(true);
  const [loadingKol, setLoadingKol] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [convertedIds, setConvertedIds] = useState<Set<string>>(new Set());
  const [usingDemo, setUsingDemo] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'SG' | 'MY'>('ALL');
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [ignoredKolIds, setIgnoredKolIds] = useState<Set<string>>(new Set());

  const fetchLaunches = useCallback(async () => {
    setLoadingLaunches(true);
    try {
      const res = await fetch('/api/launches');
      if (!res.ok) throw new Error();
      const json: { data: LaunchRecord[] } = await res.json();
      setLaunches(json.data ?? []);
      setUsingDemo(false);
    } catch {
      setLaunches(DEMO_LAUNCHES);
      setUsingDemo(true);
    } finally {
      setLoadingLaunches(false);
      setLastUpdated(new Date());
    }
  }, []);

  const fetchKol = useCallback(async () => {
    setLoadingKol(true);
    try {
      const res = await fetch('/api/kol-signals');
      if (!res.ok) throw new Error();
      const json: { data: KolRecord[] } = await res.json();
      setKolData(json.data ?? []);
    } catch {
      setKolData(DEMO_KOL);
    } finally {
      setLoadingKol(false);
    }
  }, []);

  useEffect(() => {
    fetchLaunches();
    fetchKol();
  }, [fetchLaunches, fetchKol]);

  const handleRunScraper = async () => {
    setScraping(true);
    try {
      await fetch('/api/scraper', { method: 'POST' });
    } catch {
      // scraper may still have persisted results
    } finally {
      await fetchLaunches();
      setScraping(false);
    }
  };

  const handleConvertToLead = async (kolId: string) => {
    setConvertingId(kolId);
    try {
      const res = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kol_id: kolId }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // fall through — still mark converted in UI for demo
    } finally {
      setConvertedIds((prev) => new Set([...prev, kolId]));
      setConvertingId(null);
      await fetchLaunches();
    }
  };

  // Market filter
  const filteredLaunches = launches.filter((l) => {
    if (marketFilter === 'ALL') return true;
    return marketFilter === 'MY' ? l.market === 'Malaysia' : l.market !== 'Malaysia';
  });
  const filteredKolData = kolData.filter((k) => {
    if (marketFilter === 'ALL') return true;
    return marketFilter === 'MY' ? k.market === 'Malaysia' : k.market !== 'Malaysia';
  });

  const handleIgnoreKol = (kolId: string) => {
    setIgnoredKolIds((prev) => new Set([...prev, kolId]));
  };

  // Brand filter applied on top of market filter
  const brandFilteredLaunches = brandFilter
    ? filteredLaunches.filter((l) => {
        const bn = brandFilter.toLowerCase();
        return l.brand_hint?.toLowerCase().includes(bn) || l.title?.toLowerCase().includes(bn);
      })
    : filteredLaunches;

  const brandFilteredKolData = brandFilter
    ? filteredKolData.filter((k) => k.brand_hint.toLowerCase().includes(brandFilter.toLowerCase()))
    : filteredKolData;

  // Derived metrics
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const totalActiveLeads = brandFilteredLaunches.filter((l) => l.status !== 'Converted').length;
  const conversionsThisWeek = brandFilteredLaunches.filter((l) => {
    if (!l.timestamp) return false;
    return new Date(l.timestamp) >= weekAgo && l.status === 'KOL Lead';
  }).length;
  const avgSignalScore =
    brandFilteredKolData.length > 0
      ? Math.round(brandFilteredKolData.reduce((s, k) => s + k.signal_score, 0) / brandFilteredKolData.length)
      : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* ── Header ── */}
      <header className="shrink-0 border-b border-zinc-800/80 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-sm font-semibold tracking-wide">ELITEZ SG</span>
          <span className="text-zinc-700 select-none">/</span>
          <span className="text-xs text-zinc-500 tracking-widest uppercase">FMCG BD Portal</span>
        </div>

        <div className="flex items-center gap-3">
          {/* SG / MY market toggle */}
          <div className="flex items-center rounded-md border border-zinc-700 overflow-hidden text-xs">
            {(['ALL', 'SG', 'MY'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMarketFilter(m)}
                className={`px-2.5 py-1 transition-colors ${
                  marketFilter === m
                    ? 'bg-zinc-700 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {m === 'SG' ? '🇸🇬 SG' : m === 'MY' ? '🇲🇾 MY' : 'All'}
              </button>
            ))}
          </div>

          {usingDemo && (
            <div className="flex items-center gap-1.5 text-amber-400/80 text-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Demo data — connect Google Sheets to go live</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-600 text-xs">
              {lastUpdated.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </header>

      {/* ── Metrics banner ── */}
      <div className="shrink-0 border-b border-zinc-800/60 px-5 py-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Total Active Leads"
          value={totalActiveLeads}
          icon={TrendingUp}
          accent="emerald"
          sub="across all sources"
        />
        <MetricCard
          label="Conversions This Week"
          value={conversionsThisWeek}
          icon={CheckCircle2}
          accent="amber"
          sub="KOL → Launches sheet"
        />
        <MetricCard
          label="KOL Signals"
          value={filteredKolData.length}
          icon={Users}
          accent="violet"
          sub="#prhaulsg · #mediakitsg"
        />
        <MetricCard
          label="Avg Signal Score"
          value={avgSignalScore || '—'}
          icon={Activity}
          accent="blue"
          sub="creator confidence / 100"
        />
      </div>

      {/* ── Brand Story Tray ── */}
      <BrandStoryTray
        launches={filteredLaunches}
        kolData={filteredKolData}
        activeBrand={brandFilter}
        onSelect={setBrandFilter}
      />

      {/* ── Main layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="shrink-0 w-52 border-r border-zinc-800/60 flex flex-col py-4 px-3">
          <p className="text-zinc-700 text-xs tracking-widest uppercase px-2 mb-2">Intelligence</p>
          <nav className="space-y-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                <span className="text-base leading-none">{tab.emoji}</span>
                <span>{tab.label}</span>
                {tab.id === 'launch-radar' && brandFilteredLaunches.length > 0 && (
                  <span className="ml-auto text-[10px] bg-zinc-700 text-zinc-400 rounded-full px-1.5 min-w-[18px] text-center">
                    {brandFilteredLaunches.length}
                  </span>
                )}
                {tab.id === 'kol-radar' && brandFilteredKolData.length > 0 && (
                  <span className="ml-auto text-[10px] bg-violet-500/20 text-violet-400 rounded-full px-1.5 min-w-[18px] text-center">
                    {brandFilteredKolData.length}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* RSS source list */}
          <div className="mt-auto pt-4 border-t border-zinc-800/60 px-2 space-y-2">
            <p className="text-zinc-700 text-xs tracking-widest uppercase">RSS Sources</p>
            {[
              'Campaign Brief Asia',
              'Marketing Interactive',
              'Retail News Asia',
            ].map((src) => (
              <div key={src} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-zinc-600 text-xs">{src}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Content area */}
        <main className="flex-1 overflow-auto p-6">
          {activeTab === 'launch-radar' && (
            <LaunchRadar
              launches={brandFilteredLaunches}
              loading={loadingLaunches}
              onRunScraper={handleRunScraper}
              scraping={scraping}
            />
          )}
          {activeTab === 'kol-radar' && (
            <KolRadar
              kolData={brandFilteredKolData}
              loading={loadingKol}
              onConvert={handleConvertToLead}
              convertingId={convertingId}
              convertedIds={convertedIds}
              onIgnore={handleIgnoreKol}
              ignoredKolIds={ignoredKolIds}
            />
          )}
        </main>
      </div>
    </div>
  );
}
