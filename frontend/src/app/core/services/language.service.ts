import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CountryService } from './country.service';

export interface Language {
  code: string;
  name: string;
  flag: string;
  flagSvg?: string; // SVG path for flag icon
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private translate = inject(TranslateService);
  private countryService = inject(CountryService);
  private currentLanguageSubject = new BehaviorSubject<string>('pt');
  public currentLanguage$: Observable<string> = this.currentLanguageSubject.asObservable();

  constructor() {
    const savedLanguage = localStorage.getItem('appLanguage') || 'pt';
    this.currentLanguageSubject.next(savedLanguage);
  }

  /**
   * Get the correct Portuguese flag based on user's country
   * Portugal (PT) -> 🇵🇹 Portugal flag
   * Any other country -> 🇧🇷 Brazil flag
   */
  private getPortugueseFlag(): { emoji: string; svg: string } {
    const userCountry = this.countryService.getCountry();
    const isInPortugal = userCountry === 'PT';

    return isInPortugal
      ? { emoji: '🇵🇹', svg: 'https://flagcdn.com/w20/pt.png' }
      : { emoji: '🇧🇷', svg: 'https://flagcdn.com/w20/br.png' };
  }

  /**
   * Get available languages with dynamic Portuguese flag
   */
  getAvailableLanguages(): Language[] {
    const ptFlag = this.getPortugueseFlag();

    return [
      {
        code: 'pt',
        name: 'PT',
        flag: ptFlag.emoji,
        flagSvg: ptFlag.svg
      },
      {
        code: 'es',
        name: 'ES',
        flag: '🇪🇸',
        flagSvg: 'https://flagcdn.com/w20/es.png'
      },
      {
        code: 'en',
        name: 'EN',
        flag: '🇺🇸',
        flagSvg: 'https://flagcdn.com/w20/us.png'
      }
    ];
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
   * Get language object by code
   */
  getLanguageByCode(code: string): Language | undefined {
    return this.getAvailableLanguages().find(lang => lang.code === code);
  }

  /**
   * Get current language object
   */
  getCurrentLanguageObject(): Language {
    const languages = this.getAvailableLanguages();
    return this.getLanguageByCode(this.getCurrentLanguage()) || languages[0];
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(code: string): boolean {
    return this.getAvailableLanguages().some(lang => lang.code === code);
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
