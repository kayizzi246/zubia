"use client";

// Saved (hearted) listings, kept in this browser only.
// TODO(supabase): save to a `saved_listings` table for signed-in users so
// hearts follow them between the website and the app.

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "zubia:saved";
const EMPTY: string[] = [];
const listeners = new Set<() => void>();
let cache: string[] | null = null;

function read(): string[] {
  if (cache) return cache;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    cache = [];
  }
  return cache;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function toggleSaved(id: string) {
  const current = read();
  cache = current.includes(id)
    ? current.filter((x) => x !== id)
    : [...current, id];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Storage can be blocked (private mode). Hearts still work for this visit.
  }
  listeners.forEach((listener) => listener());
}

export function useSavedIds(): string[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
