import React from 'react';
import './TagSelector.css';

interface TagSelectorProps {
  options: readonly string[];
  labels: Record<string, string>;
  selected: string[];
  onChange: (tags: string[]) => void;
  colors?: Record<string, string>;
}

const TagSelector: React.FC<TagSelectorProps> = ({ options, labels, selected, onChange, colors }) => {
  const add = (tag: string) => {
    if (!selected.includes(tag)) onChange([...selected, tag]);
  };

  const remove = (tag: string) => {
    onChange(selected.filter((t) => t !== tag));
  };

  const available = options.filter((o) => !selected.includes(o));

  return (
    <div className="tag-selector">
      {/* Selected tags box */}
      <div className="tag-selector-selected">
        {selected.length === 0 ? (
          <span className="tag-selector-empty">No tags selected — click a tag below to add it</span>
        ) : (
          selected.map((tag) => (
            <span
              key={tag}
              className="tag-selector-chosen"
              style={colors?.[tag] ? { backgroundColor: colors[tag], color: '#1B1C1E' } : undefined}
            >
              {labels[tag] ?? tag}
              <button
                type="button"
                className="tag-selector-remove"
                onClick={() => remove(tag)}
                aria-label={`Remove ${labels[tag] ?? tag}`}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>

      {/* Available tags */}
      {available.length > 0 && (
        <div className="tag-selector-available">
          {available.map((tag) => (
            <button
              key={tag}
              type="button"
              className="tag-selector-option"
              style={colors?.[tag] ? { backgroundColor: colors[tag], borderColor: 'transparent', color: '#1B1C1E' } : undefined}
              onClick={() => add(tag)}
            >
              {labels[tag] ?? tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagSelector;
