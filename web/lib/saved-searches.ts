"use client";

// Saved searches, kept in this browser only.
// TODO(supabase): store per user and send WhatsApp/email alerts when a new
// listing matches.

import { useSyncExternalStore } from "react";

export interface SavedSearch {
  /** The query string, e.g. "type=rent&district=Kampala". Also the id. */
  query: string;
  label: string;
  savedAt: string;
}

const STORAGE_KEY = "zubia:saved-searches";
const EMPTY: SavedSearch[] = [];
const listeners = new Set<() => void>();
let cache: SavedSearch[] | null = null;

function read(): SavedSearch[] {
  if (cache) return cache;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    cache = Array.isArray(parsed)
      ? parsed.filter((x): x is SavedSearch => typeof x?.query === "string" && typeof x?.label === "string")
      : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: SavedSearch[]) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked (private mode): keep it for this visit only.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Returns false if this exact search was already saved. */
export function saveSearch(query: string, label: string): boolean {
  const current = read();
  if (current.some((s) => s.query === query)) return false;
  write([{ query, label, savedAt: new Date().toISOString() }, ...current]);
  return true;
}

export function removeSavedSearch(query: string) {
  write(read().filter((s) => s.query !== query));
}

export function useSavedSearches(): SavedSearch[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
