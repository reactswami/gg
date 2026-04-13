/**
 * TagsInput
 *
 * React port of the bootstrap-tagsinput + tag-color-from-name Angular directives.
 * Replaces Angular directives: <bootstrap-tagsinput> and tag-color-from-name="..."
 *
 * Usage:
 *   <TagsInput tags={dashboard.tags} onChange={tags => setTags(tags)} />
 */

import React, { useState, useRef, useCallback, KeyboardEvent } from 'react';
import tags from 'app/core/utils/tags';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TagsInputProps {
  /** Current list of tags */
  value: string[];
  /** Called whenever tags change */
  onChange: (tags: string[]) => void;
  placeholder?: string;
  /** Extra CSS class on the tag span */
  tagClass?: string;
  width?: number;
}

// ---------------------------------------------------------------------------
// Coloured tag badge
// ---------------------------------------------------------------------------

interface ColourTagProps {
  name: string;
  onRemove: () => void;
}

const ColourTag: React.FC<ColourTagProps> = ({ name, onRemove }) => {
  const { color, borderColor } = tags.getTagColorsFromName(name);
  return (
    <span
      className="label label-tag tag"
      style={{ backgroundColor: color, borderColor }}
    >
      {name}
      <a
        onClick={e => { e.stopPropagation(); onRemove(); }}
        style={{ marginLeft: 4, cursor: 'pointer', color: 'inherit' }}
      >
        <i className="fa fa-remove" />
      </a>
    </span>
  );
};

// ---------------------------------------------------------------------------
// TagsInput
// ---------------------------------------------------------------------------

const TagsInput: React.FC<TagsInputProps> = ({
  value = [],
  onChange,
  placeholder = 'add tags',
  tagClass = 'label label-tag',
}) => {
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = useCallback((raw: string) => {
    const tag = raw.trim();
    if (!tag || value.includes(tag)) return;
    onChange([...value, tag]);
    setInputVal('');
  }, [value, onChange]);

  const removeTag = useCallback((tag: string) => {
    onChange(value.filter(t => t !== tag));
  }, [value, onChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputVal);
    }
    if (e.key === 'Backspace' && !inputVal && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }, [inputVal, value, addTag, removeTag]);

  const handleBlur = useCallback(() => {
    if (inputVal.trim()) addTag(inputVal);
  }, [inputVal, addTag]);

  return (
    <div
      className="tags-input gf-form-input"
      style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, minHeight: 32, cursor: 'text' }}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map(tag => (
        <ColourTag key={tag} name={tag} onRemove={() => removeTag(tag)} />
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputVal}
        placeholder={value.length === 0 ? placeholder : ''}
        onChange={e => setInputVal(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        style={{ border: 'none', outline: 'none', flex: 1, minWidth: 80, background: 'transparent' }}
      />
    </div>
  );
};

export default TagsInput;

// ---------------------------------------------------------------------------
// Standalone tag colour utility (replaces tag-color-from-name directive)
// ---------------------------------------------------------------------------

/**
 * useTagColor - React hook equivalent of the tag-color-from-name Angular directive.
 * Returns CSS style object to apply to an element.
 *
 * Usage:
 *   const style = useTagColor(tagName);
 *   <span style={style}>{tagName}</span>
 */
export function useTagColor(name: string): React.CSSProperties {
  const { color, borderColor } = tags.getTagColorsFromName(name);
  return { backgroundColor: color, borderColor };
}
