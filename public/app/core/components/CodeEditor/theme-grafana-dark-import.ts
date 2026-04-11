// Re-exports the Ace grafana-dark theme registration from the original location.
// The original directive imported it as a side-effect; we do the same here so
// CodeEditor.tsx can import this shim without duplicating the theme code.
import 'app/core/components/code_editor/theme-grafana-dark';
