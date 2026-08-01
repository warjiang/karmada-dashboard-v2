import * as React from "react"
import { createRoot } from "react-dom/client"
import { toast as sonnerToast } from "sonner"

import { YamlCodeEditor } from "@/components/yaml-code-editor"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Toaster } from "@/components/ui/sonner"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"

export interface ShadcnDialogOptions {
  bodyHtml?: string
  cancelLabel?: string
  confirmLabel?: string
  description?: string
  details?: Array<{
    label: string
    value: string
  }>
  confirmDisabled?: boolean
  confirmationLabel?: string
  confirmationValue?: string
  destructive?: boolean
  eyebrow?: string
  note?: string
  onConfirm?: () => void
  onMount?: (
    element: HTMLElement,
    api: ShadcnDialogApi
  ) => void | (() => void)
  title: string
}

export interface ShadcnDialogApi {
  close: () => void
  setConfirmDisabled: (disabled: boolean) => void
}

export interface ShadcnWorkspaceDialogOptions {
  bodyHtml: string
  description: string
  eyebrow: string
  onMount?: (
    element: HTMLElement,
    api: Pick<ShadcnDialogApi, "close">
  ) => void | (() => void)
  title: string
}

export interface ShadcnYamlDialogOptions {
  applyLabel?: string
  description: string
  eyebrow?: string
  onApply?: (value: string) => void
  title: string
  yaml: string
}

export interface ShadcnSheetApi {
  close: () => void
  setTab: (value: string) => void
}

export interface ShadcnSheetTab {
  contentHtml: string
  label: string
  value: string
}

export interface ShadcnSheetOptions {
  bodyHtml?: string
  contentClassName?: string
  description: string
  headerHtml?: string
  initialTab?: string
  onClose?: () => void
  onMount?: (
    element: HTMLElement,
    api: ShadcnSheetApi
  ) => void | (() => void)
  side?: "top" | "right" | "bottom" | "left"
  tabs?: ShadcnSheetTab[]
  tabsClassName?: string
  title: string
  toolbarHtml?: string
}

type OverlayState =
  | { type: "dialog"; options: ShadcnDialogOptions }
  | { type: "workspace"; options: ShadcnWorkspaceDialogOptions }
  | { type: "yaml"; options: ShadcnYamlDialogOptions }
  | { type: "sheet"; options: ShadcnSheetOptions }
  | null

function HtmlBody({ html }: { html?: string }) {
  if (!html) return null
  return (
    <div
      className="shadcn-legacy-dialog-body text-sm text-muted-foreground"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function StandardDialog({
  options,
  close,
}: {
  options: ShadcnDialogOptions
  close: () => void
}) {
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [confirmDisabled, setConfirmDisabled] = React.useState(
    Boolean(options.confirmDisabled)
  )
  const [confirmationInput, setConfirmationInput] = React.useState("")
  const confirmationId = React.useId()
  const actionDisabled = options.confirmationValue
    ? confirmationInput !== options.confirmationValue
    : confirmDisabled
  const api = React.useMemo<ShadcnDialogApi>(
    () => ({ close, setConfirmDisabled }),
    [close]
  )

  React.useEffect(() => {
    if (!contentRef.current) return
    return options.onMount?.(contentRef.current, api)
  }, [api, options])

  if (options.destructive) {
    return (
      <AlertDialog open onOpenChange={(open) => !open && close()}>
        <AlertDialogContent ref={contentRef}>
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title}</AlertDialogTitle>
            {options.description && (
              <AlertDialogDescription>
                {options.description}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          {options.details?.length ? (
            <dl className="delete-resource-summary grid gap-2 rounded-md border bg-muted/30 p-3">
              {options.details.map((detail) => (
                <div
                  key={detail.label}
                  className="grid min-w-0 grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-3 text-sm"
                >
                  <dt className="text-muted-foreground">{detail.label}</dt>
                  <dd className="truncate font-mono text-xs text-foreground">
                    {detail.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <HtmlBody html={options.bodyHtml} />
          )}
          {options.note && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {options.note}
            </p>
          )}
          {options.confirmationValue && (
            <div className="grid gap-2">
              <Label htmlFor={confirmationId} className="leading-relaxed">
                {options.confirmationLabel || "Type"}{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                  {options.confirmationValue}
                </code>{" "}
                to confirm
              </Label>
              <Input
                id={confirmationId}
                aria-label={`Type ${options.confirmationValue} to confirm`}
                value={confirmationInput}
                autoComplete="off"
                spellCheck={false}
                onChange={(event) => setConfirmationInput(event.target.value)}
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>{options.cancelLabel || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="delete-resource-action"
              disabled={actionDisabled}
              onClick={() => {
                queueMicrotask(() => options.onConfirm?.())
              }}
            >
              {options.confirmLabel || "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent ref={contentRef} showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{options.title}</DialogTitle>
          {options.description && (
            <DialogDescription>{options.description}</DialogDescription>
          )}
        </DialogHeader>
        <HtmlBody html={options.bodyHtml} />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{options.cancelLabel || "Cancel"}</Button>
          </DialogClose>
          <Button
            disabled={actionDisabled}
            onClick={() => {
              close()
              queueMicrotask(() => options.onConfirm?.())
            }}
          >
            {options.confirmLabel || "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function YamlDialog({
  options,
  close,
}: {
  options: ShadcnYamlDialogOptions
  close: () => void
}) {
  const [value, setValue] = React.useState(options.yaml)

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[800px]"
      >
        <DialogHeader>
          <DialogTitle>{options.title}</DialogTitle>
          <DialogDescription>{options.description}</DialogDescription>
        </DialogHeader>
        <YamlCodeEditor
          value={value}
          label="Resource YAML"
          height={480}
          readOnly={false}
          onChange={setValue}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            className="yaml-dialog-apply"
            onClick={() => {
              close()
              queueMicrotask(() => options.onApply?.(value))
            }}
          >
            {options.applyLabel || "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function WorkspaceDialog({
  options,
  close,
}: {
  options: ShadcnWorkspaceDialogOptions
  close: () => void
}) {
  const contentRef = React.useRef<HTMLDivElement>(null)
  const api = React.useMemo(() => ({ close }), [close])

  React.useEffect(() => {
    if (!contentRef.current) return
    return options.onMount?.(contentRef.current, api)
  }, [api, options])

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent
        ref={contentRef}
        className="pod-operation-dialog max-w-none gap-0 overflow-hidden p-0 sm:max-w-none"
      >
        <DialogHeader className="pod-operation-head">
          <DialogTitle>{options.title}</DialogTitle>
          <DialogDescription>{options.description}</DialogDescription>
        </DialogHeader>
        <div
          className="pod-operation-body"
          dangerouslySetInnerHTML={{ __html: options.bodyHtml }}
        />
      </DialogContent>
    </Dialog>
  )
}

function HtmlSheet({
  options,
  close,
  suspended = false,
}: {
  options: ShadcnSheetOptions
  close: () => void
  suspended?: boolean
}) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const ignoreRestoreCloseUntilRef = React.useRef(0)
  const firstTab = options.initialTab || options.tabs?.[0]?.value || ""
  const [activeTab, setActiveTab] = React.useState(firstTab)

  const handleClose = React.useCallback(() => {
    options.onClose?.()
    close()
  }, [close, options])

  const api = React.useMemo<ShadcnSheetApi>(
    () => ({ close: handleClose, setTab: setActiveTab }),
    [handleClose]
  )

  React.useEffect(() => {
    if (!rootRef.current) return
    return options.onMount?.(rootRef.current, api)
  }, [api, options])

  React.useEffect(() => {
    if (suspended) {
      ignoreRestoreCloseUntilRef.current = Number.POSITIVE_INFINITY
      return
    }
    if (ignoreRestoreCloseUntilRef.current === Number.POSITIVE_INFINITY) {
      ignoreRestoreCloseUntilRef.current = Date.now() + 300
    }
  }, [suspended])

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (open || suspended) return
        if (Date.now() < ignoreRestoreCloseUntilRef.current) return
        handleClose()
      }}
    >
      <SheetContent
        side={options.side || "right"}
        className={options.contentClassName}
      >
        <SheetTitle className="sr-only">{options.title}</SheetTitle>
        <SheetDescription className="sr-only">
          {options.description}
        </SheetDescription>
        <div ref={rootRef} className="shadcn-sheet-legacy-root">
          {options.headerHtml && (
            <div dangerouslySetInnerHTML={{ __html: options.headerHtml }} />
          )}
          {options.toolbarHtml && (
            <div dangerouslySetInnerHTML={{ __html: options.toolbarHtml }} />
          )}
          {options.tabs?.length ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-0">
              <TabsList
                variant="line"
                className={options.tabsClassName || "drawer-tabs"}
              >
                {options.tabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {options.tabs.map((tab) => (
                <TabsContent
                  key={tab.value}
                  value={tab.value}
                  className="drawer-content"
                >
                  <div dangerouslySetInnerHTML={{ __html: tab.contentHtml }} />
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            options.bodyHtml && (
              <div dangerouslySetInnerHTML={{ __html: options.bodyHtml }} />
            )
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function ShadcnBridge() {
  const [overlays, setOverlays] = React.useState<{
    current: OverlayState
    underlay: OverlayState
  }>({ current: null, underlay: null })
  const overlay = overlays.current
  const sheetOverlay =
    overlay?.type === "sheet"
      ? overlay
      : overlays.underlay?.type === "sheet"
        ? overlays.underlay
        : null

  const openOverlay = React.useCallback((next: Exclude<OverlayState, null>) => {
    setOverlays((state) => ({
      current: next,
      underlay:
        state.current?.type === "sheet" && next.type !== "sheet"
          ? state.current
          : null,
    }))
  }, [])

  const closeOverlay = React.useCallback(() => {
    setOverlays((state) =>
      state.underlay
        ? { current: state.underlay, underlay: null }
        : { current: null, underlay: null },
    )
  }, [])

  React.useEffect(() => {
    window.KD_SHADCN = {
      closeOverlay,
      openDialog: (options) => openOverlay({ type: "dialog", options }),
      openWorkspaceDialog: (options) => openOverlay({ type: "workspace", options }),
      openSheet: (options) => openOverlay({ type: "sheet", options }),
      openYamlDialog: (options) => openOverlay({ type: "yaml", options }),
      toast: (title, detail = "") =>
        sonnerToast(title, { description: detail || undefined }),
    }
    window.dispatchEvent(new CustomEvent("shadcn-bridge-ready"))
  }, [closeOverlay, openOverlay])

  return (
    <TooltipProvider>
      <Toaster
        position="bottom-right"
        theme={document.documentElement.dataset.theme === "dark" ? "dark" : "light"}
        richColors
        closeButton
      />
      {overlay?.type === "dialog" && (
        <StandardDialog
          options={overlay.options}
          close={closeOverlay}
        />
      )}
      {overlay?.type === "yaml" && (
        <YamlDialog
          options={overlay.options}
          close={closeOverlay}
        />
      )}
      {overlay?.type === "workspace" && (
        <WorkspaceDialog
          options={overlay.options}
          close={closeOverlay}
        />
      )}
      {sheetOverlay && (
        <HtmlSheet
          options={sheetOverlay.options}
          close={closeOverlay}
          suspended={overlay?.type !== "sheet"}
        />
      )}
    </TooltipProvider>
  )
}

const bridgeRoot = document.createElement("div")
bridgeRoot.dataset.shadcnBridgeRoot = "true"
document.body.appendChild(bridgeRoot)
createRoot(bridgeRoot).render(<ShadcnBridge />)
