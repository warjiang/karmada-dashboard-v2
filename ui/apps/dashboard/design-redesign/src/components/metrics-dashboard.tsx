import { useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

export interface MetricsDashboardState {
  component: string
  range: string
  resolution: string
  values: string[]
}

export interface MetricsDashboardApi {
  update: (next: Partial<MetricsDashboardState>) => void
}

const times = ["-55m", "-50m", "-45m", "-40m", "-35m", "-30m", "-25m", "-20m", "-15m", "-10m", "-5m", "now"]

const palette = {
  primary: "var(--blue)",
  secondary: "#0f9f8f",
  tertiary: "#8b5cf6",
  warning: "var(--amber)",
  faint: "color-mix(in srgb, var(--blue) 28%, transparent)",
}

function series(seed: number, base: number, spread: number) {
  return times.map((time, index) => ({
    time,
    value: Number((base + Math.sin((index + seed) * 0.82) * spread + index * spread * 0.11).toFixed(2)),
  }))
}

const commonConfig: ChartConfig = {
  value: { label: "Value", color: palette.primary },
  rate: { label: "Rate", color: palette.primary },
  p50: { label: "P50", color: palette.secondary },
  p90: { label: "P90", color: palette.tertiary },
  p99: { label: "P99", color: palette.warning },
  count: { label: "Observations", color: palette.primary },
  success: { label: "Success", color: palette.secondary },
  retry: { label: "Retry", color: palette.warning },
}

function valueScale(component: string) {
  if (component.includes("apiserver")) return 1.28
  if (component.includes("controller")) return 1.12
  return 1
}

function MetricCard({
  title,
  metric,
  type,
  value,
  unit,
  range,
  children,
}: {
  title: string
  metric: string
  type: "Counter" | "Gauge" | "Histogram" | "Summary"
  value: string
  unit: string
  range: string
  children: React.ReactNode
}) {
  return (
    <Card className="metrics-chart-card">
      <CardHeader className="metrics-chart-card-header">
        <div className="metrics-chart-title-row">
          <CardTitle>{title}</CardTitle>
          <Badge variant="outline" className={`metrics-type-badge is-${type.toLowerCase()}`}>{type}</Badge>
        </div>
        <div className="metrics-chart-meta"><code>{metric}</code><span>Last {range}</span></div>
        <div className="metrics-chart-current"><strong>{value}</strong><span>{unit}</span></div>
      </CardHeader>
      <CardContent className="metrics-chart-card-content">{children}</CardContent>
    </Card>
  )
}

export function MetricsDashboard({ initialState, apiRef }: { initialState: MetricsDashboardState; apiRef: React.RefObject<MetricsDashboardApi | null> }) {
  const [state, setState] = useState(initialState)
  apiRef.current = { update: (next) => setState((current) => ({ ...current, ...next })) }
  const scale = valueScale(state.component)

  const scheduleRate = useMemo(() => series(1, 14.2 * scale, 2.4 * scale), [scale])
  const bindingRate = useMemo(() => series(3, 12.8 * scale, 3.1 * scale).map((item, index) => ({ ...item, success: item.value, retry: Number((0.15 + (index % 4) * 0.08).toFixed(2)) })), [scale])
  const histogram = useMemo(() => [
    { bucket: "≤10ms", count: Math.round(165 * scale) },
    { bucket: "≤25ms", count: Math.round(284 * scale) },
    { bucket: "≤50ms", count: Math.round(392 * scale) },
    { bucket: "≤100ms", count: Math.round(228 * scale) },
    { bucket: "≤250ms", count: Math.round(81 * scale) },
    { bucket: ">250ms", count: Math.round(19 * scale) },
  ], [scale])
  const algorithmQuantiles = useMemo(() => times.map((time, index) => ({
    time,
    p50: Number((10 + Math.sin(index * 0.75) * 1.6).toFixed(1)),
    p90: Number((20 + Math.sin((index + 2) * 0.7) * 2.8).toFixed(1)),
    p99: Number((31 + Math.sin((index + 1) * 0.55) * 4.2).toFixed(1)),
  })), [])
  const extensionBuckets = useMemo(() => [
    { bucket: "PreFilter", p50: 2.4, p95: 8.2 },
    { bucket: "Filter", p50: 4.8, p95: 12.1 },
    { bucket: "Score", p50: 6.1, p95: 18.7 },
    { bucket: "Reserve", p50: 1.7, p95: 5.3 },
    { bucket: "Bind", p50: 3.4, p95: 9.6 },
  ], [])
  const pluginSummary = useMemo(() => times.map((time, index) => ({
    time,
    p50: Number((2.3 + Math.cos(index * 0.7) * 0.5).toFixed(1)),
    p90: Number((5.1 + Math.sin(index * 0.6) * 0.9).toFixed(1)),
    p99: Number((8.6 + Math.sin((index + 1) * 0.5) * 1.4).toFixed(1)),
  })), [])
  const retryRate = useMemo(() => series(6, 0.08 * scale, 0.1 * scale).map((item, index) => ({ ...item, value: index === 7 ? 0.62 : Math.max(0, item.value) })), [scale])
  const gaugeValue = Math.min(1.5, Number(state.values[7] || 0.84))
  const gaugeData = [{ name: "processor", value: gaugeValue, fill: gaugeValue > 1 ? palette.warning : palette.secondary }]

  return (
    <>
      <div className="metrics-type-summary" aria-label="Prometheus metric types">
        <span><i className="counter" /><b>Counter</b><small>3 panels · rate and increase</small></span>
        <span><i className="gauge" /><b>Gauge</b><small>1 panel · current saturation</small></span>
        <span><i className="histogram" /><b>Histogram</b><small>2 panels · bucket distribution</small></span>
        <span><i className="summary" /><b>Summary</b><small>2 panels · client quantiles</small></span>
      </div>
      <section className="metrics-dashboard-grid metrics-dashboard-grid-rich">
        <MetricCard title="Schedule attempts" metric="karmada_scheduler_schedule_attempts_total" type="Counter" value={state.values[0]} unit="ops/s" range={state.range}>
          <ChartContainer config={commonConfig} className="metrics-rechart">
            <AreaChart data={scheduleRate} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} accessibilityLayer>
              <defs><linearGradient id="counter-area" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-rate)" stopOpacity={0.3} /><stop offset="95%" stopColor="var(--color-rate)" stopOpacity={0.02} /></linearGradient></defs>
              <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" />
              <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={28} />
              <YAxis tickLine={false} axisLine={false} width={38} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent valueFormatter={(value) => `${value} ops/s`} />} />
              <Area type="monotone" dataKey="value" name="rate" stroke="var(--color-rate)" fill="url(#counter-area)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        </MetricCard>

        <MetricCard title="Incoming bindings" metric="karmada_scheduler_bindings_total" type="Counter" value={state.values[1]} unit="bindings/s" range={state.range}>
          <ChartContainer config={commonConfig} className="metrics-rechart">
            <BarChart data={bindingRate} margin={{ top: 8, right: 8, bottom: 0, left: -18 }} accessibilityLayer>
              <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" />
              <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={28} />
              <YAxis tickLine={false} axisLine={false} width={40} />
              <ChartTooltip cursor={{ fill: "var(--surface-raised)" }} content={<ChartTooltipContent />} />
              <Bar dataKey="success" stackId="binding" fill="var(--color-success)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="retry" stackId="binding" fill="var(--color-retry)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </MetricCard>

        <MetricCard title="E2E scheduling duration" metric="karmada_scheduler_e2e_scheduling_duration_seconds_bucket" type="Histogram" value={state.values[2]} unit="ms P95" range={state.range}>
          <ChartContainer config={commonConfig} className="metrics-rechart">
            <BarChart data={histogram} margin={{ top: 8, right: 8, bottom: 0, left: -12 }} accessibilityLayer>
              <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" />
              <XAxis dataKey="bucket" tickLine={false} axisLine={false} interval={0} />
              <YAxis tickLine={false} axisLine={false} width={34} />
              <ChartTooltip cursor={{ fill: "var(--surface-raised)" }} content={<ChartTooltipContent valueFormatter={(value) => `${value} observations`} />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </MetricCard>

        <MetricCard title="Scheduling algorithm duration" metric="karmada_scheduler_algorithm_duration_seconds" type="Summary" value={state.values[3]} unit="ms P99" range={state.range}>
          <ChartContainer config={commonConfig} className="metrics-rechart">
            <LineChart data={algorithmQuantiles} margin={{ top: 8, right: 8, bottom: 0, left: -18 }} accessibilityLayer>
              <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" />
              <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={28} />
              <YAxis tickLine={false} axisLine={false} width={40} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" valueFormatter={(value) => `${value} ms`} />} />
              <Line type="monotone" dataKey="p50" stroke="var(--color-p50)" strokeWidth={1.6} dot={false} />
              <Line type="monotone" dataKey="p90" stroke="var(--color-p90)" strokeWidth={1.6} dot={false} />
              <Line type="monotone" dataKey="p99" stroke="var(--color-p99)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </MetricCard>

        <MetricCard title="Framework extension latency" metric="karmada_scheduler_framework_extension_point_duration_seconds_bucket" type="Histogram" value={state.values[4]} unit="ms P95" range={state.range}>
          <ChartContainer config={{ ...commonConfig, p95: { label: "P95", color: palette.primary } }} className="metrics-rechart">
            <BarChart data={extensionBuckets} layout="vertical" margin={{ top: 6, right: 14, bottom: 0, left: 8 }} accessibilityLayer>
              <CartesianGrid horizontal={false} stroke="var(--line)" strokeDasharray="3 3" />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis dataKey="bucket" type="category" tickLine={false} axisLine={false} width={56} />
              <ChartTooltip cursor={{ fill: "var(--surface-raised)" }} content={<ChartTooltipContent valueFormatter={(value) => `${value} ms`} />} />
              <Bar dataKey="p50" stackId="latency" fill="var(--color-p50)" radius={[3, 0, 0, 3]} />
              <Bar dataKey="p95" stackId="latency" fill="var(--color-p95)" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ChartContainer>
        </MetricCard>

        <MetricCard title="Plugin execution duration" metric="karmada_scheduler_plugin_execution_duration_seconds" type="Summary" value={state.values[5]} unit="ms P99" range={state.range}>
          <ChartContainer config={commonConfig} className="metrics-rechart">
            <AreaChart data={pluginSummary} margin={{ top: 8, right: 8, bottom: 0, left: -18 }} accessibilityLayer>
              <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" />
              <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={28} />
              <YAxis tickLine={false} axisLine={false} width={40} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" valueFormatter={(value) => `${value} ms`} />} />
              <Area type="monotone" dataKey="p99" stroke="var(--color-p99)" fill="var(--color-p99)" fillOpacity={0.08} strokeWidth={1.8} />
              <Area type="monotone" dataKey="p90" stroke="var(--color-p90)" fill="var(--color-p90)" fillOpacity={0.08} strokeWidth={1.6} />
              <Line type="monotone" dataKey="p50" stroke="var(--color-p50)" strokeWidth={1.6} dot={false} />
            </AreaChart>
          </ChartContainer>
        </MetricCard>

        <MetricCard title="Workqueue retries" metric="workqueue_retries_total" type="Counter" value={state.values[6]} unit="ops/s" range={state.range}>
          <ChartContainer config={commonConfig} className="metrics-rechart">
            <AreaChart data={retryRate} margin={{ top: 8, right: 8, bottom: 0, left: -18 }} accessibilityLayer>
              <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" />
              <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={28} />
              <YAxis tickLine={false} axisLine={false} width={40} domain={[0, "auto"]} />
              <ReferenceLine y={0.5} stroke="var(--amber)" strokeDasharray="4 4" label={{ value: "alert", fill: "var(--amber)", fontSize: 9 }} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent valueFormatter={(value) => `${value} ops/s`} />} />
              <Area type="stepAfter" dataKey="value" name="rate" stroke="var(--color-rate)" fill="var(--color-rate)" fillOpacity={0.12} strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        </MetricCard>

        <MetricCard title="Longest running processor" metric="workqueue_longest_running_processor_seconds" type="Gauge" value={state.values[7]} unit="seconds" range={state.range}>
          <div className="metrics-gauge-layout">
            <ChartContainer config={commonConfig} className="metrics-rechart metrics-gauge-chart">
              <RadialBarChart data={gaugeData} startAngle={210} endAngle={-30} innerRadius="70%" outerRadius="100%" barSize={14}>
                <PolarAngleAxis type="number" domain={[0, 1.5]} angleAxisId={0} tick={false} />
                <RadialBar dataKey="value" background={{ fill: "var(--surface-raised)" }} cornerRadius={8} />
              </RadialBarChart>
            </ChartContainer>
            <div className="metrics-gauge-readout"><strong>{gaugeValue.toFixed(2)}s</strong><span>of 1.5s threshold</span><small>{gaugeValue > 1 ? "Review processor" : "Within target"}</small></div>
          </div>
        </MetricCard>
      </section>
      <div className="metrics-query-notes">
        <span><b>Counter</b><code>rate(metric_total[{state.range}])</code></span>
        <span><b>Histogram</b><code>histogram_quantile(0.95, sum by (le)(rate(metric_bucket[5m])))</code></span>
        <span><b>Summary</b><code>metric{'{quantile="0.99"}'}</code></span>
        <span><b>Resolution</b><code>{state.resolution}</code></span>
      </div>
    </>
  )
}
