import { Bot, Loader2, User } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
// TODO: Move to shared types file or app/api/analytics/bots/route.ts when created
export interface BotData {
  botType: string;
  botName: string;
  count: number;
  percentage: number;
}

export interface BotStatsData {
  totalPageviews: number;
  totalHumans: number;
  totalBots: number;
  humanPercentage: number;
  botPercentage: number;
  botsByType: BotData[];
  topBots: BotData[];
}

interface BotChartProps {
  data: BotStatsData | undefined;
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

export function BotOverviewChart({ data, loading }: BotChartProps) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
          <Loader2 className="size-4 animate-spin" />
          <span>Loading bot analytics...</span>
        </div>
      </div>
    );
  }

  if (!data || data.totalPageviews === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-neutral-600 dark:text-neutral-400">
          No bot data available
        </div>
      </div>
    );
  }

  const chartData = [
    {
      name: 'Human Traffic',
      value: data.totalHumans,
      percentage: data.humanPercentage,
      icon: User,
      color: '#0F766E',
    },
    {
      name: 'Bot Traffic',
      value: data.totalBots,
      percentage: data.botPercentage,
      icon: Bot,
      color: '#C2410C',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
          <div className="flex items-center gap-2">
            <User className="size-5 text-teal-600" />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Human Traffic
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            {data.totalHumans.toLocaleString()}
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {data.humanPercentage.toFixed(1)}% of total
          </p>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
          <div className="flex items-center gap-2">
            <Bot className="size-5 text-orange-700" />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Bot Traffic
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            {data.totalBots.toLocaleString()}
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {data.botPercentage.toFixed(1)}% of total
          </p>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props: any) =>
                `${props.name} (${props.percentage.toFixed(1)}%)`
              }
              outerRadius={80}
              fill="#D97706"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                      <p className="mb-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {data.name}
                      </p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        {data.value.toLocaleString()} pageviews (
                        {data.percentage.toFixed(1)}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function BotTypeChart({ data, loading }: BotChartProps) {
  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
          <Loader2 className="size-4 animate-spin" />
          <span>Loading bot types...</span>
        </div>
      </div>
    );
  }

  if (!data || data.botsByType.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="text-neutral-600 dark:text-neutral-400">
          No bot type data
        </div>
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data.botsByType as any}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(props: any) =>
              `${props.botType} (${props.percentage.toFixed(1)}%)`
            }
            outerRadius={80}
            fill="#D97706"
            dataKey="count"
          >
            {data.botsByType.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload?.length) {
                const data = payload[0].payload as BotData;
                return (
                  <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                    <p className="mb-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {data.botType}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {data.count.toLocaleString()} pageviews (
                      {data.percentage.toFixed(1)}%)
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopBotsChart({ data, loading }: BotChartProps) {
  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
          <Loader2 className="size-4 animate-spin" />
          <span>Loading top bots...</span>
        </div>
      </div>
    );
  }

  if (!data || data.topBots.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="text-neutral-600 dark:text-neutral-400">
          No bot data available
        </div>
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data.topBots}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-neutral-200 dark:stroke-neutral-700"
          />
          <XAxis
            type="number"
            className="text-xs text-neutral-600 dark:text-neutral-400"
          />
          <YAxis
            type="category"
            dataKey="botName"
            width={90}
            className="text-xs text-neutral-600 dark:text-neutral-400"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload?.length) {
                const data = payload[0].payload as BotData;
                return (
                  <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                    <p className="mb-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {data.botName}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {data.botType}
                    </p>
                    <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                      {data.count.toLocaleString()} pageviews (
                      {data.percentage.toFixed(1)}%)
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="count" fill="#D97706" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
