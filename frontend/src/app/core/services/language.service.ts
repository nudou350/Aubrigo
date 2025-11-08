import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Language {
  code: string;
  name: string;
  flag: string;
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private translate = inject(TranslateService);
  private currentLanguageSubject = new BehaviorSubject<string>('pt');
  public currentLanguage$: Observable<string> = this.currentLanguageSubject.asObservable();

  private readonly languages: Language[] = [
    { code: 'pt', name: 'Português (PT)', flag: '🇵🇹' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ];

  constructor() {
    const savedLanguage = localStorage.getItem('appLanguage') || 'pt';
    this.currentLanguageSubject.next(savedLanguage);
  }

  /**
   * Set the application language
   * @param lang Language code (pt, es, en)
   */
  setLanguage(lang: string): void {
    if (this.translate.langs.includes(lang)) {
      this.translate.use(lang);
      this.currentLanguageSubject.next(lang);
      localStorage.setItem('appLanguage', lang);
      document.documentElement.lang = lang;
    }
  }

  /**
   * Get current language code
   */
  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  /**
   * Get all available languages
   */
  getAvailableLanguages(): Language[] {
    return this.languages;
  }

  /**
   * Get language object by code
   */
  getLanguageByCode(code: string): Language | undefined {
    return this.languages.find(lang => lang.code === code);
  }

  /**
   * Get current language object
   */
  getCurrentLanguageObject(): Language {
    return this.getLanguageByCode(this.getCurrentLanguage()) || this.languages[0];
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(code: string): boolean {
    return this.languages.some(lang => lang.code === code);
  }

  /**
   * Get translation for a key
   */
  instant(key: string, params?: any): string {
    return this.translate.instant(key, params);
  }

  /**
   * Get translation observable for a key
   */
  get(key: string, params?: any): Observable<string> {
    return this.translate.get(key, params);
  }
}
