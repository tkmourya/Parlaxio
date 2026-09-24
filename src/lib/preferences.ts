import { account } from './appwrite';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

const updateNativeStatusBar = async (hexColor: string) => {
  if (Capacitor.isNativePlatform()) {
    try {
      await StatusBar.setBackgroundColor({ color: hexColor });
      await StatusBar.setStyle({ style: Style.Dark }); // White text for all our dark themes
    } catch (e) {
      console.log('Status bar error:', e);
    }
  }
};

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
  
  const themeObj = THEMES.find(t => t.id === themeId);
  if (themeObj) {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeObj.color);
    }
    updateNativeStatusBar(themeObj.color);
  }
  
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
  
  const themeObj = THEMES.find(t => t.id === theme);
  if (themeObj) {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeObj.color);
    }
    updateNativeStatusBar(themeObj.color);
  }
  
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
  const saved = localStorage.getItem('parlaxio_default_server');
  if (saved === null) return 1; // Default to Server 2 (VidSrc SBS)
  return parseInt(saved, 10);
}

export async function saveFamilySafeMode(enabled: boolean) {
  localStorage.setItem('parlaxio_family_safe', enabled ? 'true' : 'false');
  
  // Sync to Cloud
  try {
    const prefs = await account.getPrefs();
    await account.updatePrefs({ ...prefs, familySafe: enabled });
  } catch (error) {
    // User might not be logged in, ignore
  }
}

export function loadFamilySafeMode(): boolean {
  const saved = localStorage.getItem('parlaxio_family_safe');
  // Default to false (off) for backward compatibility
  return saved === 'true';
}
