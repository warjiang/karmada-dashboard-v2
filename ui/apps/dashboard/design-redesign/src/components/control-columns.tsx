import * as React from "react"
import { ChevronDownIcon, Columns3Icon, RotateCcwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export type ControlColumn = [key: string, label: string, type?: string]

interface ControlColumnsProps {
  columns: ControlColumn[]
  title: string
  viewId: string
}

function readHiddenColumns(storageKey: string): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) || "[]")
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : []
  } catch {
    return []
  }
}

export function ControlColumns({ columns, title, viewId }: ControlColumnsProps) {
  const storageKey = `karmada-control-columns-${viewId}`
  const [hiddenColumns, setHiddenColumns] = React.useState<string[]>(() =>
    readHiddenColumns(storageKey)
  )

  React.useEffect(() => {
    const availableColumns = new Set(columns.map(([key]) => key))
    const hidden = hiddenColumns.filter((key) => availableColumns.has(key))

    const page = document.querySelector("[data-control-view-root]")

    page
      ?.querySelectorAll<HTMLElement>("[data-control-column]")
      .forEach((cell) => {
        if (cell.dataset.controlColumn === "actions") return
        cell.hidden = hidden.includes(cell.dataset.controlColumn || "")
      })

    localStorage.setItem(storageKey, JSON.stringify(hidden))
  }, [columns, hiddenColumns, storageKey])

  const visibleCount = columns.length - hiddenColumns.length

  function setColumnVisible(key: string, visible: boolean) {
    setHiddenColumns((current) => {
      if (!visible && current.length >= columns.length - 1) return current
      return visible
        ? current.filter((column) => column !== key)
        : [...new Set([...current, key])]
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className={cn(
            "h-8 gap-1.5 rounded-md border-0 bg-secondary px-2.5 text-[11px] text-secondary-foreground shadow-none hover:bg-secondary/80",
            hiddenColumns.length && "bg-primary/10 text-primary hover:bg-primary/15"
          )}
          data-control-action="columns"
          data-control-source={viewId}
        >
          <Columns3Icon data-icon="inline-start" aria-hidden="true" />
          Columns
          <ChevronDownIcon data-icon="inline-end" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-52 border-0 shadow-[0_12px_32px_rgba(15,23,42,0.14)]"
        aria-label={`Columns for ${title}`}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Display columns</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {columns.map(([key, label]) => {
            const checked = !hiddenColumns.includes(key)
            const isLastVisible = checked && visibleCount === 1
            return (
              <DropdownMenuCheckboxItem
                key={key}
                checked={checked}
                disabled={isLastVisible}
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={(nextChecked) =>
                  setColumnVisible(key, nextChecked === true)
                }
              >
                {label}
              </DropdownMenuCheckboxItem>
            )
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            disabled={!hiddenColumns.length}
            onSelect={(event) => {
              event.preventDefault()
              setHiddenColumns([])
            }}
          >
            <RotateCcwIcon aria-hidden="true" />
            Reset columns
            <DropdownMenuShortcut>
              {visibleCount}/{columns.length}
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
