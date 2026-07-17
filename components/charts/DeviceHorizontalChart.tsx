import type { DeviceData } from '@/app/api/analytics/devices/route';

interface DeviceHorizontalChartProps {
  data: DeviceData[];
  title: string;
  loading?: boolean;
}

const COLORS = [
  'hsl(var(--chart-1))', // orange (primary)
  'hsl(var(--chart-2))', // teal
  'hsl(var(--chart-3))', // amber
  'hsl(var(--chart-4))', // muted purple
  'hsl(var(--chart-5))', // steel blue
  '#65A30D', // lime green
  '#C2410C', // deep orange
  '#0891B2', // cyan
  '#BE185D', // rose
  '#4F46E5', // indigo
];

export function DeviceHorizontalChart({
  data,
  title,
  loading,
}: DeviceHorizontalChartProps) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">
          Loading {title.toLowerCase()}...
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">
          No {title.toLowerCase()} data
        </div>
      </div>
    );
  }

  // Take top 8 items
  const topItems = data.slice(0, 8);
  const maxValue = Math.max(...topItems.map((item) => item.value));

  return (
    <div className="space-y-3">
      {topItems.map((item, index) => {
        const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        const color = COLORS[index % COLORS.length];

        // Determine text colors based on bar width
        // If bar is too short, label will be on neutral background
        const labelOnBar = percentage > 35;
        // If bar is wide enough, value might be on colored background
        const valueOnBar = percentage > 75;

        const labelColor = labelOnBar ? 'text-white' : 'text-foreground';
        const valueColor = valueOnBar ? 'text-white' : 'text-foreground';

        return (
          <div key={index} className="group">
            <div className="relative h-9 overflow-hidden rounded-md bg-muted">
              {/* Colored background bar */}
              <div
                className="absolute inset-0 transition-[width]"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: color,
                }}
              />
              {/* Text content on top */}
              <div className="relative flex h-full items-center justify-between px-3 text-xs font-medium">
                <span className={`truncate ${labelColor}`}>
                  {item.name || 'Unknown'}
                </span>
                <span className={`ml-2 shrink-0 ${valueColor}`}>
                  {item.value.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
