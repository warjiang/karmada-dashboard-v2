import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

export type ChartConfig = Record<
  string,
  { label?: React.ReactNode; color?: string }
>

const ChartContext = React.createContext<{ config: ChartConfig }>({ config: {} })

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"]
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn("flex aspect-video justify-center text-xs", className)}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const entries = Object.entries(config).filter(([, item]) => item.color)
  if (!entries.length) return null
  return (
    <style dangerouslySetInnerHTML={{
      __html: `[data-chart=${id}] {\n${entries.map(([key, item]) => `  --color-${key}: ${item.color};`).join("\n")}\n}`,
    }} />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

interface TooltipItem {
  color?: string
  dataKey?: string | number
  name?: string | number
  value?: string | number | ReadonlyArray<string | number>
}

function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  indicator = "dot",
  labelFormatter,
  valueFormatter,
}: {
  active?: boolean
  payload?: TooltipItem[]
  label?: React.ReactNode
  className?: string
  indicator?: "dot" | "line" | "dashed"
  labelFormatter?: (label: React.ReactNode) => React.ReactNode
  valueFormatter?: (value: TooltipItem["value"], name: TooltipItem["name"]) => React.ReactNode
}) {
  const { config } = React.useContext(ChartContext)
  if (!active || !payload?.length) return null

  return (
    <div className={cn("grid min-w-[9rem] gap-2 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-xl", className)}>
      <div className="font-medium text-foreground">{labelFormatter ? labelFormatter(label) : label}</div>
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = String(item.dataKey || item.name || index)
          const itemConfig = config[key]
          return (
            <div key={`${key}-${index}`} className="flex items-center gap-2">
              <span
                className={cn("shrink-0 rounded-[2px]", indicator === "dot" ? "size-2.5" : "h-0.5 w-3", indicator === "dashed" && "border-t border-dashed bg-transparent")}
                style={{ backgroundColor: item.color || itemConfig?.color }}
              />
              <span className="text-muted-foreground">{itemConfig?.label || item.name}</span>
              <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
                {valueFormatter ? valueFormatter(item.value, item.name) : item.value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { ChartContainer, ChartTooltip, ChartTooltipContent }
