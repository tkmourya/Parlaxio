import { account } from './appwrite';

export const THEMES = [
  { id: 'default', name: 'Pitch Black', desc: 'True AMOLED Black', color: '#000000' },
  { id: 'midnight', name: 'Midnight Ocean', desc: 'Deep Space Blue', color: '#060a1f' },
  { id: 'crimson', name: 'Crimson Glow', desc: 'Dark Maroon Hue', color: '#1a0505' },
  { id: 'forest', name: 'Forest Shadow', desc: 'Deep Pine Green', color: '#05140b' },
  { id: 'amethyst', name: 'Amethyst Purple', desc: 'Dark Royal Purple', color: '#13081c' },
  { id: 'silver', name: 'Frosted Silver', desc: 'Liquid Glass Gray', color: '#1e2126' },
];

export async function saveTheme(themeId: string) {
  localStorage.setItem('parlaxio_theme', themeId);
  document.documentElement.setAttribute('data-theme', themeId);
  
  // Sync to Cloud
  try {
    const prefs = await account.getPrefs();
    await account.updatePrefs({ ...prefs, theme: themeId });
  } catch (error) {
    // User might not be logged in, ignore
  }
}

export function loadTheme(): string {
  const theme = localStorage.getItem('parlaxio_theme') || 'default';
  document.documentElement.setAttribute('data-theme', theme);
  return theme;
}

export async function saveDefaultServer(index: number) {
  localStorage.setItem('parlaxio_default_server', index.toString());
  
  // Sync to Cloud
  try {
    const prefs = await account.getPrefs();
    await account.updatePrefs({ ...prefs, defaultServer: index });
  } catch (error) {
    // User might not be logged in, ignore
  }
}

export function loadDefaultServer(): number {
  return parseInt(localStorage.getItem('parlaxio_default_server') || '0', 10);
}
