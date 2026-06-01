import type { DeviceData } from '@/app/api/analytics/devices/route';

interface DeviceHorizontalChartProps {
  data: DeviceData[];
  title: string;
  loading?: boolean;
}

const COLORS = [
  '#D97706', // amber (primary)
  '#0F766E', // teal
  '#E09145', // warm orange
  '#7C6FA0', // muted purple
  '#2B6CB0', // steel blue
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
        <div className="text-neutral-600 dark:text-neutral-400">
          Loading {title.toLowerCase()}...
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-neutral-600 dark:text-neutral-400">
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

        const labelColor = labelOnBar
          ? 'text-white'
          : 'text-neutral-900 dark:text-neutral-100';
        const valueColor = valueOnBar
          ? 'text-white'
          : 'text-neutral-900 dark:text-neutral-100';

        return (
          <div key={index} className="group">
            <div className="relative h-9 overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800">
              {/* Colored background bar */}
              <div
                className="absolute inset-0 transition-all"
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
