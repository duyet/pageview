import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { EmptyChartState } from '@/components/charts/EmptyChartState';

interface LocationMapProps {
  data: Array<{
    country: string;
    count: number;
  }>;
  loading?: boolean;
}

// Country code to full name mapping for display
const countryNames: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  ES: 'Spain',
  IT: 'Italy',
  NL: 'Netherlands',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  PL: 'Poland',
  BE: 'Belgium',
  CH: 'Switzerland',
  AT: 'Austria',
  IE: 'Ireland',
  PT: 'Portugal',
  CZ: 'Czech Republic',
  RO: 'Romania',
  GR: 'Greece',
  HU: 'Hungary',
  BR: 'Brazil',
  MX: 'Mexico',
  AR: 'Argentina',
  CL: 'Chile',
  CO: 'Colombia',
  PE: 'Peru',
  VE: 'Venezuela',
  CN: 'China',
  JP: 'Japan',
  KR: 'South Korea',
  IN: 'India',
  ID: 'Indonesia',
  TH: 'Thailand',
  VN: 'Vietnam',
  MY: 'Malaysia',
  SG: 'Singapore',
  PH: 'Philippines',
  TW: 'Taiwan',
  HK: 'Hong Kong',
  NZ: 'New Zealand',
  ZA: 'South Africa',
  EG: 'Egypt',
  NG: 'Nigeria',
  KE: 'Kenya',
  RU: 'Russia',
  UA: 'Ukraine',
  TR: 'Turkey',
  IL: 'Israel',
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  PK: 'Pakistan',
  BD: 'Bangladesh',
};

export function LocationMap({ data, loading }: LocationMapProps) {
  const { maxCount, colorScale } = useMemo(() => {
    if (!data || data.length === 0) return { maxCount: 0, colorScale: [] };

    const max = Math.max(...data.map((d) => d.count));
    const scale = data.map((item) => ({
      ...item,
      intensity: item.count / max,
      name: countryNames[item.country] || item.country,
    }));

    return { maxCount: max, colorScale: scale };
  }, [data]);

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>Loading location data...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyChartState
        title="No location data"
        description="Geographic data will appear as visitors arrive"
        illustration="globe"
      />
    );
  }

  // Get color based on intensity (0-1)
  const getColor = (intensity: number) => {
    const colors = [
      'bg-amber-100 dark:bg-amber-950',
      'bg-amber-200 dark:bg-amber-900',
      'bg-amber-300 dark:bg-amber-800',
      'bg-amber-400 dark:bg-amber-700',
      'bg-amber-500 dark:bg-amber-600',
      'bg-amber-600 dark:bg-amber-500',
      'bg-amber-700 dark:bg-amber-400',
    ];

    const index = Math.min(
      Math.floor(intensity * colors.length),
      colors.length - 1,
    );
    return colors[index];
  };

  return (
    <div className="space-y-4">
      {/* Heatmap Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {colorScale.map((item, index) => (
          <div
            key={index}
            className={`group relative cursor-default rounded-lg border border-border p-3 transition-[transform,box-shadow] hover:scale-105 hover:shadow-md ${getColor(item.intensity)}`}
          >
            <div className="flex flex-col items-center gap-1">
              <div className="text-lg font-bold text-foreground">
                {item.country}
              </div>
              <div className="text-2xl font-bold tabular-nums text-foreground">
                {item.count.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">views</div>
            </div>

            {/* Tooltip on hover */}
            <div className="pointer-events-none absolute -top-12 left-1/2 z-10 hidden -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-lg group-hover:block">
              <div className="font-medium text-foreground">{item.name}</div>
              <div className="text-xs text-muted-foreground">
                {item.count.toLocaleString()} visits
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>Less traffic</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`h-4 w-6 rounded ${getColor(i / 6)}`}></div>
          ))}
        </div>
        <span>More traffic</span>
      </div>
    </div>
  );
}
