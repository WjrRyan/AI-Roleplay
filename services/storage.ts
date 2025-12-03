
import { SavedSession } from '../types';

const STORAGE_KEY = 'ai_coach_history';

export const getSavedSessions = (): SavedSession[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load history", e);
    return [];
  }
};

export const saveSession = (session: SavedSession) => {
  const current = getSavedSessions();
  // Add to beginning
  const updated = [session, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const deleteSession = (id: string) => {
  const current = getSavedSessions();
  const updated = current.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};
