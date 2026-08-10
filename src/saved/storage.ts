import type { DesignState } from '../designer/designState';

export interface SavedDesign {
  id: string;
  name: string;
  savedAt: string;
  design: DesignState;
}

const STORAGE_KEY = 'flute-builder-saved-designs';

export function getSavedDesigns(): SavedDesign[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveDesign(name: string, design: DesignState): void {
  const saved = getSavedDesigns();
  saved.unshift({
    id: Date.now().toString(),
    name: name.trim() || 'Untitled',
    savedAt: new Date().toISOString(),
    design,
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
}

export function deleteSavedDesign(id: string): SavedDesign[] {
  const updated = getSavedDesigns().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
