'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types — mirror the Supabase schema exactly
// ---------------------------------------------------------------------------

type TabId = 'launch-radar' | 'kol-radar';

interface LaunchRecord {
  id: string;
  brand_name: string;
  product_name: string;
  market: string;
  retail_channel?: string;
  distributor_point?: string;
  festive_tag?: string;
  product_photo_url?: string;
  creator_display_name?: string;
  pitch_status?: string;
  last_action_date?: string;
}

interface KolRecord {
  id: string;
  platform: string;
  creator_display_name?: string;
  market: string;
  detected_keywords?: string;
  product_photo_url?: string;
  source_url?: string;
  captured_date?: string;
}

// ---------------------------------------------------------------------------
// Fallback demo data (shown when Supabase credentials are absent)
// ---------------------------------------------------------------------------

const DEMO_LAUNCHES: LaunchRecord[] = [
  {
    id: 'demo_a1b2',
    brand_name: 'Meiji',
    product_name: 'Matcha soft serve collab — FairPrice Finest exclusive',
    market: 'Singapore',
    retail_channel: 'FairPrice',
    distributor_point: 'Auric Pacific',
    festive_tag: 'None',
    product_photo_url: '',
    pitch_status: 'Raw',
    last_action_date: '2026-05-25T08:12:00Z',
  },
  {
    id: 'demo_c3d4',
    brand_name: 'Korean Snack Import',
    product_name: 'Cold Storage premium Korean snack aisle — 12 new SKUs Q3',
    market: 'Singapore',
    retail_channel: 'Cold Storage',
    distributor_point: 'DKSH',
    festive_tag: 'None',
    product_photo_url: '',
    pitch_status: 'Raw',
    last_action_date: '2026-05-24T14:30:00Z',
  },
  {
    id: 'demo_kol4',
    brand_name: 'Japanese Ramen Import',
    product_name: '[KOL Signal] @nasilemakking_sg — New ramen line for Sheng Siong Q3',
    market: 'Singapore',
    retail_channel: 'Sheng Siong',
    distributor_point: 'DKSH',
    festive_tag: 'None',
    product_photo_url: '',
    creator_display_name: '@nasilemakking_sg',
    pitch_status: 'KOL Lead',
    last_action_date: '2026-05-24T10:05:00Z',
  },
  {
    id: 'demo_e5f6',
    brand_name: 'Unknown Beverage',
    product_name: 'New FMCG beverage brand targets NTUC FairPrice exclusive listing',
    market: 'Singapore',
    retail_channel: 'FairPrice',
    distributor_point: 'Direct',
    festive_tag: 'None',
    product_photo_url: '',
    pitch_status: 'Contacted',
    last_action_date: '2026-05-23T09:00:00Z',
  },
  {
    id: 'demo_my01',
    brand_name: 'Japanese Snack Co',
    product_name: 'Jaya Grocer Malaysia exclusive — 6 SKU debut launch',
    market: 'Malaysia',
    retail_channel: 'Jaya Grocer',
    distributor_point: 'DKSH',
    festive_tag: 'None',
    product_photo_url: '',
    pitch_status: 'Raw',
    last_action_date: '2026-05-25T07:45:00Z',
  },
];

const DEMO_KOL: KolRecord[] = [
  {
    id: 'kol_001',
    platform: 'Instagram',
    creator_display_name: '@sgfoodiequeenie',
    market: 'Singapore',
    detected_keywords: '#prhaulsg, #sgfoodie, FairPrice, FMCG unboxing mystery brand',
    product_photo_url: '',
    source_url: '#',
    captured_date: '2026-05-24T14:32:00Z',
  },
  {
    id: 'kol_002',
    platform: 'TikTok',
    creator_display_name: '@mediakitsg_trev',
    market: 'Singapore',
    detected_keywords: '#mediakitsg, #sgfoodie, snack brand, Cold Storage launch',
    product_photo_url: '',
    source_url: '#',
    captured_date: '2026-05-24T10:15:00Z',
  },
  {
    id: 'kol_003',
    platform: 'Instagram',
    creator_display_name: '@unboxwithpriya',
    market: 'Singapore',
    detected_keywords: '#prhaulsg, #sgbeauty, Beauty x FMCG collab, limited edition',
    product_photo_url: '',
    source_url: '#',
    captured_date: '2026-05-23T20:45:00Z',
  },
  {
    id: 'kol_004',
    platform: 'YouTube',
    creator_display_name: '@nasilemakking_sg',
    market: 'Singapore',
    detected_keywords: '#sgfoodie, #unboxing, ramen, Sheng Siong, Japanese import',
    product_photo_url: '',
    source_url: '#',
    captured_date: '2026-05-25T08:00:00Z',
  },
  {
    id: 'kol_005',
    platform: 'TikTok',
    creator_display_name: '@chillaxwithchels',
    market: 'Singapore',
    detected_keywords: '#prhaulsg, #mediakitsg, beverage, NTUC, new launch',
    product_photo_url: '',
    source_url: '#',
    captured_date: '2026-05-25T06:30:00Z',
  },
  {
    id: 'kol_006',
    platform: 'Instagram',
    creator_display_name: '@jayagrocerfinds',
    market: 'Malaysia',
    detected_keywords: '#malaysiafood, #jayagrocer, Japanese snack, KL launch',
    product_photo_url: '',
    source_url: '#',
    captured_date: '2026-05-25T09:00:00Z',
  },
  {
    id: 'kol_007',
    platform: 'TikTok',
    creator_display_name: '@guardianhaulmy',
    market: 'Malaysia',
    detected_keywords: '#guardianmy, #prhaulmy, skincare FMCG collab, Raya limited edition',
    product_photo_url: '',
    source_url: '#',
    captured_date: '2026-05-25T11:30:00Z',
  },
];

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

const PLATFORM_EMOJI: Record<string, string> = {
  Instagram: '📸',
  TikTok: '🎵',
  YouTube: '▶️',
};

const STATUS_PILL: Record<string, string> = {
  Raw:       'bg-sky-500/10 text-sky-400 border border-sky-500/20',
  'KOL Lead':'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  Contacted: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  Converted: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
};

const BRAND_GRADIENTS: Array<[string, string, string]> = [
  ['meiji',    '#9d174d', '#831843'],
  ['nestlé',   '#a16207', '#78350f'],
  ['nestle',   '#a16207', '#78350f'],
  ['unilever', '#1d4ed8', '#1e40af'],
  ['danone',   '#3730a3', '#312e81'],
  ['mondelez', '#6b21a8', '#581c87'],
  ['p&g',      '#0369a1', '#075985'],
  ['kellogg',  '#b91c1c', '#991b1b'],
  ['mars',     '#92400e', '#78350f'],
  ['abbott',   '#047857', '#065f46'],
  ['f&n',      '#c2410c', '#9a3412'],
];

function brandGradient(name: string): string {
  const bn = (name ?? '').toLowerCase();
  const match = BRAND_GRADIENTS.find(([key]) => bn.includes(key));
  return match
    ? `linear-gradient(135deg, ${match[1]}, ${match[2]})`
    : 'linear-gradient(135deg, #27272a, #18181b)';
}

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// ProductFrame — aspect-square with real image or gradient fallback
// ---------------------------------------------------------------------------

function ProductFrame({
  photoUrl,
  brandName,
  altText,
}: {
  photoUrl?: string;
  brandName: string;
  altText: string;
}) {
  const [imgError, setImgError] = useState(false);
  const showImg = !!photoUrl && !imgError;

  return (
    <div className="w-full aspect-square relative overflow-hidden bg-zinc-950 border-y border-white/[0.05]">
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={altText}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ background: brandGradient(brandName) }}
        >
          <span className="text-white/20 text-7xl font-black select-none">
            {(brandName ?? '?')[0].toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}

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
          l.brand_name?.toLowerCase().includes(bn) && l.pitch_status !== 'Converted',
      ) ||
      kolData.some((k) => k.detected_keywords?.toLowerCase().includes(bn))
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
                  <span className="text-white text-xs font-bold select-none">{brand.initial}</span>
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
  amber:   { text: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/20'   },
  violet:  { text: 'text-violet-400',  bg: 'bg-violet-400/10',  border: 'border-violet-400/20'  },
  blue:    { text: 'text-blue-400',    bg: 'bg-blue-400/10',    border: 'border-blue-400/20'    },
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
            FMCG signals — trade publications · RSS feeds · SG & MY
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/reports/download"
            download
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/25 hover:border-emerald-500/50 rounded-md text-xs text-emerald-300 transition-all"
          >
            <Download className="w-3 h-3" />
            Export Report
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
          <p className="text-sm">No launches yet — run the scraper or add rows in Supabase.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {launches.map((row) => (
            <div
              key={row.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden flex flex-col hover:border-zinc-700 transition-colors"
            >
              {/* Header */}
              <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                  style={{ background: brandGradient(row.brand_name) }}
                >
                  {(row.brand_name ?? '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-zinc-200 text-xs font-semibold truncate">{row.brand_name}</p>
                  <p className="text-zinc-600 text-[10px] flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 inline shrink-0" />
                    {row.market}{row.retail_channel ? ` · ${row.retail_channel}` : ''}
                  </p>
                </div>
                <span
                  className={`shrink-0 inline-block px-2 py-0.5 rounded text-[10px] ${
                    STATUS_PILL[row.pitch_status ?? ''] ?? 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {row.pitch_status ?? '—'}
                </span>
              </div>

              {/* Product photo / gradient frame */}
              <ProductFrame
                photoUrl={row.product_photo_url}
                brandName={row.brand_name}
                altText={row.product_name}
              />

              {/* Caption metadata */}
              <div className="px-3 py-2.5 flex-1 flex flex-col gap-1.5">
                <p className="text-zinc-200 text-xs font-medium leading-snug line-clamp-2">
                  {row.product_name}
                </p>
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
                  {row.creator_display_name && (
                    <span className="text-[10px] text-violet-400/60 bg-violet-400/5 border border-violet-400/10 rounded px-1.5 py-0.5">
                      {row.creator_display_name}
                    </span>
                  )}
                </div>
              </div>

              {/* Action baseline */}
              <div className="flex items-center justify-between px-3 pb-3 pt-1 border-t border-zinc-800/60">
                <p className="text-zinc-700 text-[10px]">{fmtDate(row.last_action_date)}</p>
                <span className="text-zinc-800 text-[10px]">supabase ↗</span>
              </div>
            </div>
          ))}
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
        <h2 className="text-zinc-100 font-semibold text-sm tracking-wide">KOL Intelligence Radar</h2>
        <p className="text-zinc-500 text-xs mt-0.5">
          Creator signals — SG & MY ·{' '}
          <span className="text-violet-400/70">#prhaulsg</span> ·{' '}
          <span className="text-violet-400/70">#mediakitsg</span>
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-5 h-5 text-zinc-700 animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-zinc-600 gap-2">
          <Users className="w-7 h-7" />
          <p className="text-sm">No KOL signals — add rows to kol_intel in Supabase.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((kol) => {
            const converted = convertedIds.has(kol.id);
            const converting = convertingId === kol.id;
            const keywords = kol.detected_keywords
              ?.split(',')
              .map((k) => k.trim())
              .filter(Boolean) ?? [];

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
                    <p className="text-zinc-200 text-xs font-medium truncate">
                      {kol.creator_display_name ?? 'Unknown Creator'}
                    </p>
                    <p className="text-zinc-600 text-[10px]">
                      {kol.platform} · {kol.market}
                    </p>
                  </div>
                  <span className="shrink-0 text-zinc-600 text-[10px]">
                    {kol.captured_date
                      ? new Date(kol.captured_date).toLocaleDateString('en-SG', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : '—'}
                  </span>
                </div>

                {/* Product photo / gradient frame */}
                <ProductFrame
                  photoUrl={kol.product_photo_url}
                  brandName={kol.detected_keywords ?? kol.platform}
                  altText={kol.creator_display_name ?? 'KOL post'}
                />

                {/* Caption metadata */}
                <div className="px-3 py-2.5 flex-1 flex flex-col gap-1.5">
                  {keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {keywords.slice(0, 5).map((kw) => (
                        <span
                          key={kw}
                          className="text-[10px] text-violet-400/60 bg-violet-400/5 border border-violet-400/10 rounded px-1 py-0.5"
                        >
                          {kw.startsWith('#') ? kw : `#${kw}`}
                        </span>
                      ))}
                    </div>
                  )}
                  {kol.source_url && kol.source_url !== '#' && (
                    <a
                      href={kol.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 text-[10px] transition-colors w-fit"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      View post
                    </a>
                  )}
                </div>

                {/* Action baseline */}
                <div className="flex items-center justify-between px-3 pb-3 pt-1 border-t border-zinc-800/60">
                  <p className="text-zinc-700 text-[10px]">{kol.market}</p>
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
                        {converting ? <Loader2 className="w-3 h-3 animate-spin" /> : '🚀'} Convert
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
  { id: 'kol-radar',    label: 'KOL Radar',    emoji: '📱' },
];

export default function Dashboard() {
  const [activeTab,     setActiveTab]     = useState<TabId>('launch-radar');
  const [launches,      setLaunches]      = useState<LaunchRecord[]>([]);
  const [kolData,       setKolData]       = useState<KolRecord[]>([]);
  const [loadingLaunches, setLoadingLaunches] = useState(true);
  const [loadingKol,    setLoadingKol]    = useState(true);
  const [scraping,      setScraping]      = useState(false);
  const [convertingId,  setConvertingId]  = useState<string | null>(null);
  const [convertedIds,  setConvertedIds]  = useState<Set<string>>(new Set());
  const [usingDemo,     setUsingDemo]     = useState(false);
  const [lastUpdated,   setLastUpdated]   = useState(new Date());
  const [marketFilter,  setMarketFilter]  = useState<'ALL' | 'SG' | 'MY'>('ALL');
  const [brandFilter,   setBrandFilter]   = useState<string | null>(null);
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

  const handleIgnoreKol = (kolId: string) => {
    setIgnoredKolIds((prev) => new Set([...prev, kolId]));
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

  // Brand filter (applied on top of market filter)
  const brandFilteredLaunches = brandFilter
    ? filteredLaunches.filter((l) =>
        l.brand_name?.toLowerCase().includes(brandFilter.toLowerCase()),
      )
    : filteredLaunches;
  const brandFilteredKolData = brandFilter
    ? filteredKolData.filter(
        (k) =>
          k.detected_keywords?.toLowerCase().includes(brandFilter.toLowerCase()) ||
          k.creator_display_name?.toLowerCase().includes(brandFilter.toLowerCase()),
      )
    : filteredKolData;

  // Derived metrics
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const totalActiveLeads    = brandFilteredLaunches.filter((l) => l.pitch_status !== 'Converted').length;
  const kolLeadsThisWeek    = brandFilteredLaunches.filter(
    (l) => l.pitch_status === 'KOL Lead' && !!l.last_action_date && new Date(l.last_action_date) >= weekAgo,
  ).length;
  const myLeadsCount        = brandFilteredLaunches.filter((l) => l.market === 'Malaysia').length;

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
              <span>Demo data — set SUPABASE_URL + SUPABASE_ANON_KEY in Vercel</span>
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
          label="Active Leads"
          value={totalActiveLeads}
          icon={TrendingUp}
          accent="emerald"
          sub="pitch_status ≠ Converted"
        />
        <MetricCard
          label="KOL Leads (7d)"
          value={kolLeadsThisWeek}
          icon={Zap}
          accent="amber"
          sub="KOL → Launches"
        />
        <MetricCard
          label="KOL Signals"
          value={brandFilteredKolData.length}
          icon={Users}
          accent="violet"
          sub="#prhaulsg · #mediakitsg"
        />
        <MetricCard
          label="MY Market"
          value={myLeadsCount}
          icon={Activity}
          accent="blue"
          sub="Malaysia launches"
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
            {['Campaign Brief Asia', 'Marketing Interactive', 'Retail News Asia'].map((src) => (
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
