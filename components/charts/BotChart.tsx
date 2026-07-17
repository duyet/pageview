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

export function BotOverviewChart({ data, loading }: BotChartProps) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>Loading bot analytics...</span>
        </div>
      </div>
    );
  }

  if (!data || data.totalPageviews === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">No bot data available</div>
      </div>
    );
  }

  const chartData = [
    {
      name: 'Human Traffic',
      value: data.totalHumans,
      percentage: data.humanPercentage,
      icon: User,
      color: 'hsl(var(--chart-2))',
    },
    {
      name: 'Bot Traffic',
      value: data.totalBots,
      percentage: data.botPercentage,
      icon: Bot,
      color: 'hsl(var(--chart-3))',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <div className="flex items-center gap-2">
            <User className="size-5 text-chart-2" />
            <span className="text-sm text-muted-foreground">Human Traffic</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {data.totalHumans.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">
            {data.humanPercentage.toFixed(1)}% of total
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <div className="flex items-center gap-2">
            <Bot className="size-5 text-chart-3" />
            <span className="text-sm text-muted-foreground">Bot Traffic</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {data.totalBots.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">
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
              fill="hsl(var(--chart-1))"
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
                    <div className="rounded-lg border border-border bg-popover p-3 shadow-lg">
                      <p className="mb-1 text-sm font-medium text-foreground">
                        {data.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
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
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>Loading bot types...</span>
        </div>
      </div>
    );
  }

  if (!data || data.botsByType.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="text-muted-foreground">No bot type data</div>
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
            fill="hsl(var(--chart-1))"
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
                  <div className="rounded-lg border border-border bg-popover p-3 shadow-lg">
                    <p className="mb-1 text-sm font-medium text-foreground">
                      {data.botType}
                    </p>
                    <p className="text-xs text-muted-foreground">
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
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>Loading top bots...</span>
        </div>
      </div>
    );
  }

  if (!data || data.topBots.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="text-muted-foreground">No bot data available</div>
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
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis type="number" className="text-xs text-muted-foreground" />
          <YAxis
            type="category"
            dataKey="botName"
            width={90}
            className="text-xs text-muted-foreground"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload?.length) {
                const data = payload[0].payload as BotData;
                return (
                  <div className="rounded-lg border border-border bg-popover p-3 shadow-lg">
                    <p className="mb-1 text-sm font-medium text-foreground">
                      {data.botName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {data.botType}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {data.count.toLocaleString()} pageviews (
                      {data.percentage.toFixed(1)}%)
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="count"
            fill="hsl(var(--chart-1))"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
