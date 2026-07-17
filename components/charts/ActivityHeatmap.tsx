import { Loader2 } from 'lucide-react';

interface ActivityHeatmapProps {
  data: Array<{ day: number; hour: number; count: number }>;
  loading?: boolean;
  maxCount?: number;
}

const CELL_SIZE = 14;
const GAP = 3;
const BORDER_RADIUS = 3;

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_LABELS = [0, 3, 6, 9, 12, 15, 18, 21];

const COLOR_SCALE = [
  '#E5E5E5', // 0 — muted / empty
  '#FEF3C7', // amber-100
  '#FDE68A', // amber-200
  '#FBBF24', // amber-400
  '#D97706', // amber-600
  '#B45309', // amber-700
];

const LABEL_WIDTH = 32;
const TOP_PADDING = 20;

function getIntensityColor(count: number, max: number): string {
  if (count === 0 || max === 0) return COLOR_SCALE[0];
  const ratio = count / max;
  if (ratio <= 0.01) return COLOR_SCALE[0];
  if (ratio <= 0.2) return COLOR_SCALE[1];
  if (ratio <= 0.4) return COLOR_SCALE[2];
  if (ratio <= 0.6) return COLOR_SCALE[3];
  if (ratio <= 0.8) return COLOR_SCALE[4];
  return COLOR_SCALE[5];
}

export function ActivityHeatmap({
  data,
  loading,
  maxCount,
}: ActivityHeatmapProps) {
  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>Loading activity...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="text-muted-foreground">No activity data</div>
      </div>
    );
  }

  const max = maxCount ?? Math.max(...data.map((d) => d.count), 1);

  // Build lookup map: day_hour -> count
  const lookup = new Map<string, number>();
  for (const { day, hour, count } of data) {
    lookup.set(`${day}_${hour}`, count);
  }

  const gridWidth = 24 * (CELL_SIZE + GAP) - GAP;
  const gridHeight = 7 * (CELL_SIZE + GAP) - GAP;
  const svgWidth = LABEL_WIDTH + gridWidth;
  const svgHeight = TOP_PADDING + gridHeight;

  return (
    <div className="overflow-x-auto">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ fontFamily: 'inherit' }}
      >
        {/* Hour labels (top) */}
        {HOUR_LABELS.map((hour) => (
          <text
            key={hour}
            x={LABEL_WIDTH + hour * (CELL_SIZE + GAP) + CELL_SIZE / 2}
            y={TOP_PADDING - 6}
            textAnchor="middle"
            className="text-xs fill-muted-foreground"
          >
            {hour}
          </text>
        ))}

        {/* Day labels + cells */}
        {DAY_LABELS.map((label, day) => {
          const y = TOP_PADDING + day * (CELL_SIZE + GAP);

          return (
            <g key={day}>
              {/* Day label */}
              <text
                x={LABEL_WIDTH - 6}
                y={y + CELL_SIZE / 2}
                textAnchor="end"
                dominantBaseline="central"
                className="text-xs fill-muted-foreground"
              >
                {label}
              </text>

              {/* Hour cells */}
              {Array.from({ length: 24 }, (_, hour) => {
                const count = lookup.get(`${day}_${hour}`) ?? 0;
                const x = LABEL_WIDTH + hour * (CELL_SIZE + GAP);

                return (
                  <rect
                    key={hour}
                    x={x}
                    y={y}
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    rx={BORDER_RADIUS}
                    fill={getIntensityColor(count, max)}
                  >
                    <title>
                      {label}, {hour}:00 — {count.toLocaleString()} views
                    </title>
                  </rect>
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-1.5 pl-[32px]">
        <span className="text-xs text-muted-foreground">Less</span>
        {COLOR_SCALE.map((color, i) => (
          <span
            key={i}
            className="inline-block shrink-0"
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              borderRadius: BORDER_RADIUS,
              backgroundColor: color,
            }}
          />
        ))}
        <span className="text-xs text-muted-foreground">More</span>
      </div>
    </div>
  );
}
