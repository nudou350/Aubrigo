import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'petsos-theme';

  // Signal to track current theme
  currentTheme = signal<Theme>(this.getInitialTheme());

  constructor() {
    // Effect to apply theme changes to document
    effect(() => {
      const theme = this.currentTheme();
      // Force light mode on desktop/tablet (screens >= 768px)
      if (this.isDesktopOrTablet()) {
        this.applyTheme('light');
      } else {
        this.applyTheme(theme);
      }
      this.saveTheme(theme);
    });

    // Listen for window resize to force light mode on desktop
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        if (this.isDesktopOrTablet()) {
          this.applyTheme('light');
        } else {
          this.applyTheme(this.currentTheme());
        }
      });
    }
  }

  /**
   * Check if current device is desktop or tablet (screen >= 768px)
   */
  private isDesktopOrTablet(): boolean {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return false;
  }

  /**
   * Get initial theme from localStorage (defaults to light mode)
   * Desktop/tablet always get light mode
   */
  private getInitialTheme(): Theme {
    // Desktop/tablet always get light mode
    if (this.isDesktopOrTablet()) {
      return 'light';
    }

    try {
      // Check localStorage first (only for mobile)
      const savedTheme = localStorage.getItem(this.THEME_KEY) as Theme | null;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
    } catch (error) {
      // localStorage might not be available (private mode, PWA issues, etc.)
      console.warn('Could not access localStorage for theme:', error);
    }

    // Always default to light mode (ignore system preference)
    return 'light';
  }

  /**
   * Apply theme to document
   */
  private applyTheme(theme: Theme): void {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
      root.style.colorScheme = 'light';
    }

    // Update meta theme-color for PWA
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#1a1a1a' : '#4ca8a0');
    }

    // Update color-scheme meta tag
    const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
    if (metaColorScheme) {
      metaColorScheme.setAttribute('content', theme === 'dark' ? 'dark' : 'light');
    }
  }

  /**
   * Save theme preference to localStorage
   */
  private saveTheme(theme: Theme): void {
    try {
      localStorage.setItem(this.THEME_KEY, theme);
    } catch (error) {
      // localStorage might not be available (private mode, PWA issues, etc.)
      console.warn('Could not save theme to localStorage:', error);
    }
  }

  /**
   * Toggle between light and dark theme
   */
  toggleTheme(): void {
    this.currentTheme.update(current => current === 'light' ? 'dark' : 'light');
  }

  /**
   * Set specific theme
   */
  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
  }

  /**
   * Get current theme value
   */
  getTheme(): Theme {
    return this.currentTheme();
  }

  /**
   * Check if dark mode is active
   */
  isDarkMode(): boolean {
    return this.currentTheme() === 'dark';
  }
}
