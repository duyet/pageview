import { cn } from '@/lib/utils';

interface EmptyChartStateProps {
  title: string;
  description?: string;
  illustration?: 'chart' | 'globe' | 'activity';
  className?: string;
}

function ChartIllustration() {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-24 w-36"
    >
      {/* Gentle wave behind bars */}
      <path
        d="M8 58 Q30 38, 60 48 Q90 58, 112 38"
        stroke="#0F766E"
        strokeWidth="1.5"
        fill="none"
        opacity="0.15"
      />

      {/* Bar 1 */}
      <rect
        x="20"
        y="42"
        width="14"
        height="24"
        rx="4"
        fill="#D97706"
        opacity="0.35"
      />

      {/* Bar 2 */}
      <rect
        x="40"
        y="28"
        width="14"
        height="38"
        rx="4"
        fill="#D97706"
        opacity="0.55"
      />

      {/* Bar 3 */}
      <rect
        x="60"
        y="18"
        width="14"
        height="48"
        rx="4"
        fill="#D97706"
        opacity="0.75"
      />

      {/* Bar 4 */}
      <rect
        x="80"
        y="34"
        width="14"
        height="32"
        rx="4"
        fill="#D97706"
        opacity="0.45"
      />

      {/* Dot accents */}
      <circle cx="15" cy="30" r="2" fill="#7C6FA0" opacity="0.4" />
      <circle cx="100" cy="20" r="1.5" fill="#0F766E" opacity="0.35" />
      <circle cx="55" cy="12" r="1.5" fill="#D4D0C8" opacity="0.5" />
      <circle cx="105" cy="50" r="1.8" fill="#D97706" opacity="0.25" />
    </svg>
  );
}

function GlobeIllustration() {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-24 w-36"
    >
      {/* Outer circle */}
      <circle
        cx="60"
        cy="40"
        r="28"
        stroke="#D97706"
        strokeWidth="1.5"
        opacity="0.5"
      />

      {/* Vertical meridian */}
      <ellipse
        cx="60"
        cy="40"
        rx="14"
        ry="28"
        stroke="#D97706"
        strokeWidth="1"
        opacity="0.35"
      />

      {/* Horizontal parallel */}
      <ellipse
        cx="60"
        cy="40"
        rx="28"
        ry="12"
        stroke="#D97706"
        strokeWidth="1"
        opacity="0.3"
      />

      {/* Upper parallel */}
      <path
        d="M36 28 Q60 20, 84 28"
        stroke="#D97706"
        strokeWidth="0.8"
        opacity="0.2"
        fill="none"
      />

      {/* Lower parallel */}
      <path
        d="M36 52 Q60 60, 84 52"
        stroke="#D97706"
        strokeWidth="0.8"
        opacity="0.2"
        fill="none"
      />

      {/* Location pin dots */}
      <circle cx="48" cy="32" r="2.5" fill="#0F766E" opacity="0.6" />
      <circle cx="72" cy="44" r="2" fill="#0F766E" opacity="0.45" />
      <circle cx="54" cy="52" r="1.8" fill="#0F766E" opacity="0.35" />

      {/* Small accent dots */}
      <circle cx="32" cy="22" r="1.2" fill="#7C6FA0" opacity="0.3" />
      <circle cx="88" cy="56" r="1" fill="#D4D0C8" opacity="0.4" />
    </svg>
  );
}

function ActivityIllustration() {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-24 w-36"
    >
      {/* Heartbeat / activity line */}
      <path
        d="M6 44 Q18 44, 26 44 Q32 44, 36 38 L40 28 L44 52 L48 20 L52 56 L56 36 Q60 44, 66 44 Q72 44, 78 40 Q82 38, 86 42 Q92 46, 98 44 L114 44"
        stroke="#D97706"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.65"
      />

      {/* Peak dots in teal */}
      <circle cx="40" cy="28" r="2.5" fill="#0F766E" opacity="0.5" />
      <circle cx="48" cy="20" r="2.5" fill="#0F766E" opacity="0.6" />
      <circle cx="52" cy="56" r="2" fill="#0F766E" opacity="0.4" />

      {/* Subtle accent dots */}
      <circle cx="16" cy="28" r="1.2" fill="#D4D0C8" opacity="0.35" />
      <circle cx="104" cy="32" r="1.5" fill="#7C6FA0" opacity="0.3" />
    </svg>
  );
}

const illustrations = {
  chart: ChartIllustration,
  globe: GlobeIllustration,
  activity: ActivityIllustration,
} as const;

export function EmptyChartState({
  title,
  description,
  illustration = 'chart',
  className,
}: EmptyChartStateProps) {
  const Illustration = illustrations[illustration];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-8',
        className,
      )}
    >
      <div className="mb-3 opacity-60">
        <Illustration />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
