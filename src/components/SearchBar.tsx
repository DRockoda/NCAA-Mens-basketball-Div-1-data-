import { useState, useMemo, useRef, useEffect } from 'react';
import type { ColumnConfig } from '../config/columns';

interface SearchBarProps {
  searchTags: string[];
  onSearchTagsChange: (tags: string[]) => void;
  data: any[];
  columns: ColumnConfig[];
}

export function SearchBar({ searchTags, onSearchTagsChange, data, columns }: SearchBarProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const searchableColumns = columns.filter(c => c.searchable);

  const suggestions = useMemo(() => {
    const q = inputValue.toLowerCase().trim();
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
  }, [inputValue, data, searchableColumns]);

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

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !searchTags.includes(trimmedTag)) {
      onSearchTagsChange([...searchTags, trimmedTag]);
      setInputValue('');
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onSearchTagsChange(searchTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      } else if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        addTag(suggestions[selectedIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
      setShowSuggestions(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    } else if (e.key === 'Backspace' && inputValue === '' && searchTags.length > 0) {
      // Remove last tag on backspace when input is empty
      removeTag(searchTags[searchTags.length - 1]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setShowSuggestions(true);
          setSelectedIndex(-1);
        }}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        placeholder={searchTags.length > 0 ? "Add another search term..." : "Search..."}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      />
      
      {/* Suggestions Dropdown */}
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
      
      {/* Search Tags - Below the input */}
      {searchTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {searchTags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-white text-sm rounded-full"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${tag}`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
