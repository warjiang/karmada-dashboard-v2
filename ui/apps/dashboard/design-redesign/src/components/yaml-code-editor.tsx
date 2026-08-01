import * as React from "react"
import { yaml } from "@codemirror/lang-yaml"
import { EditorState } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import CodeMirror from "@uiw/react-codemirror"
import { CheckIcon, CopyIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

interface YamlCodeEditorProps {
  className?: string
  height: number
  label: string
  onChange: (value: string) => void
  readOnly: boolean
  value: string
}

export function YamlCodeEditor({
  className = "",
  height,
  label,
  onChange,
  readOnly,
  value,
}: YamlCodeEditorProps) {
  const [currentValue, setCurrentValue] = React.useState(value)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    setCurrentValue(value)
  }, [value])

  React.useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1400)
    return () => window.clearTimeout(timer)
  }, [copied])

  const extensions = React.useMemo(
    () => [
      yaml(),
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ "aria-label": label }),
      EditorState.readOnly.of(readOnly),
      EditorView.editable.of(!readOnly),
    ],
    [label, readOnly]
  )

  function updateValue(nextValue: string) {
    setCurrentValue(nextValue)
    onChange(nextValue)
  }

  async function copyYaml() {
    await navigator.clipboard.writeText(currentValue)
    setCopied(true)
  }

  const lineCount = Math.max(1, currentValue.split("\n").length)

  return (
    <div className={`yaml-code-editor overflow-hidden rounded-lg border bg-card ${className}`} data-read-only={readOnly}>
      <div className="flex h-10 items-center gap-2 border-b px-3">
        <span className="truncate text-xs font-medium">{label}</span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">
          {readOnly ? "Read only" : "Editable"} · {lineCount} lines
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={copied ? "YAML copied" : "Copy YAML"}
          title={copied ? "Copied" : "Copy YAML"}
          onClick={copyYaml}
        >
          {copied ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
        </Button>
      </div>
      <CodeMirror
        value={currentValue}
        height={`${height}px`}
        theme="dark"
        extensions={extensions}
        basicSetup
        indentWithTab
        readOnly={readOnly}
        onChange={updateValue}
      />
    </div>
  )
}
