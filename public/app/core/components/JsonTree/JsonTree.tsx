/**
 * JsonTree
 *
 * React port of the jsonTree Angular directive (components/jsontree/jsontree.ts).
 * Renders a collapsible JSON explorer using the existing JsonExplorer class.
 *
 * Usage:
 *   <JsonTree object={someObject} startExpanded rootName="Response" />
 */

import React, { useRef, useEffect } from 'react';
import { JsonExplorer } from 'app/core/components/json_explorer/json_explorer';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface JsonTreeProps {
  object: any;
  startExpanded?: boolean;
  rootName?: string;
  /** Initial depth to expand (default: 3) */
  depth?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const JsonTree: React.FC<JsonTreeProps> = ({
  object,
  startExpanded = false,
  rootName,
  depth = 3,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const explorer = new JsonExplorer(object, depth, {
      animateOpen: true,
      rootName,
    });

    // render(true) means render opened
    containerRef.current.innerHTML = explorer.render(startExpanded);
  }, [object, startExpanded, rootName, depth]);

  return <div ref={containerRef} />;
};

export default JsonTree;
