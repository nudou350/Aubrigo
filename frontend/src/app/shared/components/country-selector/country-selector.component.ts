import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CountryService, Country } from '../../../core/services/country.service';

@Component({
  selector: 'app-country-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './country-selector.component.html',
  styleUrls: ['./country-selector.component.scss']
})
export class CountrySelectorComponent implements OnInit {
  searchQuery = signal<string>('');
  isDropdownOpen = signal<boolean>(false);
  filteredCountries = signal<Country[]>([]);
  selectedCountry = signal<Country | null>(null);
  focusedIndex = signal<number>(-1);

  // Computed property for display value
  displayValue = computed(() => {
    const country = this.selectedCountry();
    return country ? `${country.flag} ${country.name}` : '';
  });

  constructor(public countryService: CountryService) {
    // Sync with country service
    effect(() => {
      const currentCountry = this.countryService.currentCountryData();
      if (currentCountry) {
        this.selectedCountry.set(currentCountry);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    // Load initial country
    const currentCountry = this.countryService.getCurrentCountryData();
    if (currentCountry) {
      this.selectedCountry.set(currentCountry);
    }
  }

  /**
   * Handle input focus - show dropdown with all countries
   */
  onFocus(): void {
    this.isDropdownOpen.set(true);
    if (!this.searchQuery()) {
      this.loadAllCountries();
    }
  }

  /**
   * Handle input blur - hide dropdown after a delay
   */
  onBlur(): void {
    // Delay to allow click on dropdown items
    setTimeout(() => {
      this.isDropdownOpen.set(false);
      this.focusedIndex.set(-1);
    }, 200);
  }

  /**
   * Handle input change - search countries
   */
  onSearchChange(): void {
    const query = this.searchQuery();

    if (!query || query.trim().length === 0) {
      this.loadAllCountries();
      return;
    }

    this.countryService.searchCountries(query.trim(), 5).subscribe({
      next: (countries) => {
        this.filteredCountries.set(countries);
        this.focusedIndex.set(-1);
      },
      error: () => {
        this.filteredCountries.set([]);
      }
    });
  }

  /**
   * Load all countries
   */
  private loadAllCountries(): void {
    this.countryService.getAllCountries().subscribe({
      next: (countries) => {
        // Limit to first 5 countries when showing all
        this.filteredCountries.set(countries.slice(0, 5));
      },
      error: () => {
        this.filteredCountries.set([]);
      }
    });
  }

  /**
   * Select a country
   */
  selectCountry(country: Country): void {
    this.selectedCountry.set(country);
    this.searchQuery.set('');
    this.isDropdownOpen.set(false);
    this.countryService.setCountry(country.code);

    // Reload page to apply country filter
    window.location.reload();
  }

  /**
   * Handle keyboard navigation
   */
  onKeyDown(event: KeyboardEvent): void {
    const countries = this.filteredCountries();
    const currentIndex = this.focusedIndex();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (currentIndex < countries.length - 1) {
          this.focusedIndex.set(currentIndex + 1);
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (currentIndex > 0) {
          this.focusedIndex.set(currentIndex - 1);
        }
        break;

      case 'Enter':
        event.preventDefault();
        if (currentIndex >= 0 && currentIndex < countries.length) {
          this.selectCountry(countries[currentIndex]);
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.isDropdownOpen.set(false);
        this.searchQuery.set('');
        break;
    }
  }

  /**
   * Check if index is focused
   */
  isFocused(index: number): boolean {
    return this.focusedIndex() === index;
  }

  /**
   * Reset to auto-detect country based on current location
   */
  resetToAutoDetect(): void {
    if (confirm('Deseja detectar automaticamente o país baseado na sua localização atual?')) {
      this.countryService.clearCountry();
      // Reload page to apply new country
      window.location.reload();
    }
  }
}
