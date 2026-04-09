/*
Copyright 2026 The Karmada Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import Editor, { EditorProps } from '@monaco-editor/react';

// Unified Monaco Editor configuration
const defaultOptions: EditorProps['options'] = {
  theme: 'vs',
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Source Code Pro', Consolas, Monaco, 'Courier New', monospace",
  fontLigatures: true,
  lineNumbers: 'on',
  minimap: { enabled: false },
  wordWrap: 'on',
  automaticLayout: true,
  scrollBeyondLastLine: false,
  renderWhitespace: 'selection',
  tabSize: 2,
  insertSpaces: true,
  detectIndentation: true,
  folding: true,
  foldingStrategy: 'indentation',
  showFoldingControls: 'always',
  renderLineHighlight: 'line',
  selectOnLineNumbers: true,
  cursorBlinking: 'blink',
  cursorSmoothCaretAnimation: 'on',
  smoothScrolling: true,
  contextmenu: true,
  quickSuggestions: true,
  parameterHints: { enabled: true },
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnEnter: 'on',
  formatOnPaste: true,
  formatOnType: true,
};

interface MonacoEditorProps extends Omit<EditorProps, 'options'> {
  options?: EditorProps['options'];
  height?: string;
  width?: string;
}

export function MonacoEditor({ options, height = '100%', width = '100%', ...props }: MonacoEditorProps) {
  return (
    <Editor
      height={height}
      width={width}
      theme="vs"
      options={{
        ...defaultOptions,
        ...options,
      }}
      {...props}
    />
  );
}
