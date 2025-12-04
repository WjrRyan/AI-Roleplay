
import { SavedSession, Persona } from '../types';

const STORAGE_KEY = 'ai_coach_history';
const PERSONAS_KEY = 'ai_coach_custom_personas';

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

export const updateSession = (id: string, updates: Partial<SavedSession>) => {
  const current = getSavedSessions();
  const updated = current.map(s => s.id === id ? { ...s, ...updates } : s);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const deleteSession = (id: string) => {
  const current = getSavedSessions();
  const updated = current.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

// --- Custom Personas Storage ---

export const getCustomPersonas = (): Persona[] => {
  try {
    const raw = localStorage.getItem(PERSONAS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load custom personas", e);
    return [];
  }
};

export const saveCustomPersona = (persona: Persona) => {
  const current = getCustomPersonas();
  // If editing functionality existed, we'd check ID, but for now we just append new ones
  // Or replace if ID exists
  const exists = current.findIndex(p => p.id === persona.id);
  let updated;
  
  if (exists >= 0) {
     updated = [...current];
     updated[exists] = persona;
  } else {
     // Ensure it has an ID
     if (!persona.id) persona.id = Date.now().toString();
     updated = [persona, ...current];
  }
  
  localStorage.setItem(PERSONAS_KEY, JSON.stringify(updated));
};

export const deleteCustomPersona = (id: string) => {
  const current = getCustomPersonas();
  const updated = current.filter(p => p.id !== id);
  localStorage.setItem(PERSONAS_KEY, JSON.stringify(updated));
};
