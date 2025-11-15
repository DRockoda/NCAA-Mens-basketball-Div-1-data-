import { useState, useMemo, useRef, useEffect } from 'react';
import type { ColumnConfig } from '../config/columns';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  data: any[];
  columns: ColumnConfig[];
  onSelectSuggestion?: (value: string) => void;
}

export function SearchBar({ value, onChange, data, columns, onSelectSuggestion }: SearchBarProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const searchableColumns = columns.filter(c => c.searchable);

  const suggestions = useMemo(() => {
    const q = value.toLowerCase().trim();
    if (!q || q.length < 2) return [];

    const maxSuggestions = 10;
    const items = new Set<string>();

    for (const row of data) {
      for (const col of searchableColumns) {
        const cellValue = String(row[col.id] ?? '').trim();
        if (cellValue && cellValue.toLowerCase().includes(q)) {
          items.add(cellValue);
          if (items.size >= maxSuggestions) break;
        }
      }
      if (items.size >= maxSuggestions) break;
    }

    return Array.from(items).slice(0, maxSuggestions);
  }, [value, data, searchableColumns]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
      setShowSuggestions(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && suggestions[selectedIndex]) {
      e.preventDefault();
      const selected = suggestions[selectedIndex];
      onChange(selected);
      onSelectSuggestion?.(selected);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    onSelectSuggestion?.(suggestion);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
          setSelectedIndex(-1);
        }}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search..."
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${
                index === selectedIndex ? 'bg-primary/10' : ''
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

