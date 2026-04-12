/**
 * TextPanel (React)
 *
 * React replacement for TextPanelCtrl + module.html.
 * Supports three modes: markdown, html (iframe srcdoc), link (iframe src).
 *
 * Sandbox options are read from the global dashboard_data object,
 * matching the exact behaviour of getSandboxOptions() in TextPanelCtrl.
 *
 * Export name PanelComponent is required by DashboardPanel/PanelChrome
 * to detect this as a React panel.
 */

import React, { useMemo } from 'react';
import markdownit from 'markdown-it';
import { PanelProps } from 'app/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TextOptions {
  mode: 'markdown' | 'html' | 'link' | 'text';
  content: string;
}

interface Props extends PanelProps<TextOptions> {}

// ---------------------------------------------------------------------------
// Sandbox helper (mirrors getSandboxOptions() exactly)
// ---------------------------------------------------------------------------

declare const dashboard_data: any;

function getSandboxOptions(): string {
  let sandbox = '';
  try {
    if (!dashboard_data) return sandbox;
    if (dashboard_data.db_sandbox_downloads === 'on')       sandbox += ' allow-downloads';
    if (dashboard_data.db_sandbox_forms === 'on')           sandbox += ' allow-forms';
    if (dashboard_data.db_sandbox_modals === 'on')          sandbox += ' allow-modals';
    if (dashboard_data.db_sandbox_pointerlock === 'on')     sandbox += ' allow-pointer-lock';
    if (dashboard_data.db_sandbox_popups === 'on')          sandbox += ' allow-popups';
    if (dashboard_data.db_sandbox_unsafepopups === 'on')    sandbox += ' allow-popups-to-escape-sandbox';
    if (dashboard_data.db_sandbox_sameorigin === 'on')      sandbox += ' allow-same-origin';
    if (dashboard_data.db_sandbox_scripts === 'on')         sandbox += ' allow-scripts';
    if (dashboard_data.db_sandbox_redirection === 'on')     sandbox += ' allow-top-navigation';
  } catch { /* dashboard_data not defined in test environments */ }
  return sandbox.trim();
}

// ---------------------------------------------------------------------------
// Markdown renderer (singleton, matching Angular ctrl's lazy init)
// ---------------------------------------------------------------------------

let md: markdownit | null = null;
function renderMarkdown(content: string): string {
  if (!md) md = new markdownit();
  return md.render(content);
}

// ---------------------------------------------------------------------------
// TextPanel component
// ---------------------------------------------------------------------------

const IFRAME_STYLE = 'width="100%" height="100%" style="border:0;margin:0;padding:0"';

export const TextPanel: React.FC<Props> = ({ options, panel }) => {
  const mode    = options?.mode    ?? panel?.options?.mode    ?? 'markdown';
  const content = options?.content ?? panel?.options?.content ?? '';

  const rendered = useMemo(() => {
    const sandbox = getSandboxOptions();

    switch (mode) {
      case 'markdown':
        return { type: 'html' as const, html: renderMarkdown(content) };

      case 'html':
        return {
          type: 'iframe' as const,
          srcdoc: content,
          sandbox,
        };

      case 'link':
        return {
          type: 'iframe-src' as const,
          src: content,
          sandbox,
        };

      case 'text':
      default: {
        const escaped = content
          .replace(/&/g, '&amp;')
          .replace(/>/g, '&gt;')
          .replace(/</g, '&lt;')
          .replace(/\n/g, '<br/>');
        return { type: 'html' as const, html: escaped };
      }
    }
  }, [mode, content]);

  if (rendered.type === 'iframe') {
    return (
      <iframe
        style={{ width: '100%', height: '100%', border: 0, margin: 0, padding: 0 }}
        srcDoc={rendered.srcdoc}
        sandbox={rendered.sandbox}
        title="Text panel"
      />
    );
  }

  if (rendered.type === 'iframe-src') {
    return (
      <iframe
        style={{ width: '100%', height: '100%', border: 0, margin: 0, padding: 0 }}
        src={rendered.src}
        sandbox={rendered.sandbox}
        title="Text panel"
      />
    );
  }

  return (
    <div
      className="markdown-html panel-text-content"
      dangerouslySetInnerHTML={{ __html: rendered.html }}
      onClick={(e) => {
        // Replicate TextPanelCtrl.clicked(): open links in _top when target is empty
        const target = e.target as HTMLAnchorElement;
        if (target.tagName === 'A' && target.target === '') {
          target.target = '_top';
        }
      }}
    />
  );
};

// Required export name for React panel detection in DashboardPanel
export { TextPanel as PanelComponent };
