/**
 * CodeEditor
 *
 * React port of the codeEditor Angular directive (components/code_editor/code_editor.ts).
 * Wraps the Ace editor via the brace package used in the original directive.
 *
 * Usage:
 *   <CodeEditor
 *     content={query}
 *     mode="sql"
 *     onChange={val => setQuery(val)}
 *     maxLines={30}
 *     showGutter
 *   />
 */

import React, { useEffect, useRef, useCallback } from 'react';
import ace from 'brace';
import config from 'app/core/config';

import './theme-grafana-dark-import'; // registers the custom theme

// Brace language modes
import 'brace/ext/language_tools';
import 'brace/theme/textmate';
import 'brace/mode/text';
import 'brace/snippets/text';
import 'brace/mode/sql';
import 'brace/snippets/sql';
import 'brace/mode/sqlserver';
import 'brace/snippets/sqlserver';
import 'brace/mode/markdown';
import 'brace/snippets/markdown';
import 'brace/mode/json';
import 'brace/snippets/json';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_THEME_DARK  = 'ace/theme/grafana-dark';
const DEFAULT_THEME_LIGHT = 'ace/theme/textmate';
const DEFAULT_MODE        = 'text';
const DEFAULT_MAX_LINES   = 10;
const DEFAULT_TAB_SIZE    = 2;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CodeEditorProps {
  /** Current editor content */
  content: string;
  /** Language mode: 'sql', 'json', 'text', etc. */
  mode?: string;
  /** Max visible lines (editor auto-grows 1 - maxLines) */
  maxLines?: number;
  /** Show line-number gutter */
  showGutter?: boolean;
  /** Tab size */
  tabSize?: number;
  /** Auto-pair brackets/quotes */
  behavioursEnabled?: boolean;
  /** Enable snippets */
  snippetsEnabled?: boolean;
  /** Called on blur or Ctrl/Cmd+Enter */
  onChange?: (value: string) => void;
  /** External autocomplete provider */
  getCompleter?: () => any;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CodeEditor: React.FC<CodeEditorProps> = ({
  content,
  mode = DEFAULT_MODE,
  maxLines = DEFAULT_MAX_LINES,
  showGutter = false,
  tabSize = DEFAULT_TAB_SIZE,
  behavioursEnabled = true,
  snippetsEnabled = true,
  onChange,
  getCompleter,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef    = useRef<any>(null);

  // -- Initialize editor on mount --------------------------------------------

  useEffect(() => {
    if (!containerRef.current) return;

    const editor = ace.edit(containerRef.current);
    editorRef.current = editor;

    const session = editor.getSession();

    // Options
    editor.setOptions({
      maxLines,
      showGutter,
      tabSize: Number(tabSize),
      behavioursEnabled,
      highlightActiveLine: false,
      showPrintMargin: false,
      autoScrollEditorIntoView: true,
    });

    // Theme
    const theme = config.bootData?.user?.lightTheme
      ? DEFAULT_THEME_LIGHT
      : DEFAULT_THEME_DARK;
    editor.setTheme(theme);

    // Language mode
    ace.acequire('ace/ext/language_tools');
    editor.setOptions({
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true,
      enableSnippets: snippetsEnabled,
    });

    if (getCompleter) {
      const completer = getCompleter();
      if (completer) {
        (editor as any).completers = [...((editor as any).completers || []), completer];
      }
    }

    session.setMode(`ace/mode/${mode}`);

    // Initial content
    editor.setValue(content ?? '');
    editor.clearSelection();

    // Blur handler
    editor.on('blur', () => {
      onChange?.(editor.getValue());
    });

    // Ctrl/Cmd+Enter
    editor.commands.addCommand({
      name: 'executeQuery',
      bindKey: { win: 'Ctrl-Enter', mac: 'Command-Enter' },
      exec: () => {
        onChange?.(editor.getValue());
      },
    });

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on mount

  // -- Sync content changes from outside ------------------------------------

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const current = editor.getValue();
    if (content !== current) {
      editor.setValue(content ?? '');
      editor.clearSelection();
    }
  }, [content]);

  // -- Sync mode changes ----------------------------------------------------

  useEffect(() => {
    editorRef.current?.getSession().setMode(`ace/mode/${mode}`);
  }, [mode]);

  // -- Render ----------------------------------------------------------------

  return <div ref={containerRef} style={{ width: '100%' }} />;
};

export default CodeEditor;
