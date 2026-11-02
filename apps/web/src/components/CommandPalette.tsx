'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, CornerDownLeft, X, Layers } from 'lucide-react';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';

export interface CommandItem {
  id: string;
  name: string;
  href: string;
  desc?: string;
  category: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  authorizedModules: {
    category: string;
    items: {
      name: string;
      href: string;
      desc?: string;
    }[];
  }[];
}

export function CommandPalette({ isOpen, onClose, authorizedModules }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const reducedMotion = use_reducedMotion();

  // Flatten authorized items for fast search
  const flatItems: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = [
      { id: 'dashboard', name: 'Dashboard Overview', href: '/dashboard', desc: 'Return to main workspace', category: 'General' },
    ];

    authorizedModules.forEach((cat) => {
      cat.items.forEach((item) => {
        items.push({
          id: `${cat.category}-${item.href}`,
          name: item.name,
          href: item.href,
          desc: item.desc,
          category: cat.category,
        });
      });
    });

    return items;
  }, [authorizedModules]);

  // Filter items matching query
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return flatItems;
    return flatItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.desc && item.desc.toLowerCase().includes(q))
    );
  }, [flatItems, query]);

  // Reset selection index when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation inside command palette
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        navigate(filteredItems[selectedIndex].href);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }

  function navigate(href: string) {
    onClose();
    router.push(href);
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Universal Command & Navigation Menu"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette Container */}
      <div
        className={`relative w-full max-w-xl rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-2xl overflow-hidden z-10 transition-all ${
          reducedMotion ? '' : 'animate-in fade-in zoom-in-95 duration-150'
        }`}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/40">
          <Search className="w-5 h-5 text-slate-400 dark:text-neutral-500 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search school modules, records, and shortcuts..."
            className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            aria-autocomplete="list"
            aria-controls="command-palette-results"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Close command palette"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          id="command-palette-results"
          role="listbox"
          className="max-h-80 overflow-y-auto p-2 space-y-1"
        >
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center">
              <Layers className="w-8 h-8 mx-auto text-slate-300 dark:text-neutral-600 mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No matching school modules</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Try searching for Classes, Attendance, Fees, or Exams</p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => navigate(item.href)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                    isSelected
                      ? 'bg-[#1B4F8C] text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">{item.name}</span>
                      <span
                        className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {item.category}
                      </span>
                    </div>
                    {item.desc && (
                      <p
                        className={`text-[11px] truncate mt-0.5 ${
                          isSelected ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {item.desc}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-1">
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-blue-200" aria-hidden="true" />
                    )}
                    <ArrowRight
                      className={`w-3.5 h-3.5 ${
                        isSelected ? 'text-white' : 'text-slate-300 dark:text-neutral-600'
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2 border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/60 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-700 border border-slate-200 dark:border-neutral-600 font-mono text-[9px]">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-700 border border-slate-200 dark:border-neutral-600 font-mono text-[9px]">Enter</kbd> Select</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-700 border border-slate-200 dark:border-neutral-600 font-mono text-[9px]">Esc</kbd> Close</span>
          </div>
          <span className="font-semibold text-[#E86524]">Role-Verified Scope</span>
        </div>
      </div>
    </div>
  );
}
