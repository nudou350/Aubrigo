import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UsersService, ONG } from '../../core/services/users.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { PetsService } from '../../core/services/pets.service';
import { CountryService } from '../../core/services/country.service';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';

@Component({
  selector: 'app-ongs',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, LanguageSelectorComponent, TranslateModule],
  templateUrl: './ongs.component.html',
  styleUrl: './ongs.component.scss',
})
export class OngsComponent implements OnInit {
  private usersService = inject(UsersService);
  private petsService = inject(PetsService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private countryService = inject(CountryService);
  private translate = inject(TranslateService);
  authService = inject(AuthService);

  ongs = signal<ONG[]>([]);
  allOngs = signal<ONG[]>([]); // Store all ONGs for search typeahead
  loading = signal(true);
  searchQuery = signal('');
  currentLocation = signal('');

  // Location typeahead
  showLocationDropdown = signal(false);
  availableLocations: string[] = [];
  filteredLocations = signal<string[]>(this.availableLocations);
  selectedLocationIndex = signal(-1);

  // ONG search typeahead
  showOngDropdown = signal(false);
  filteredOngs = signal<ONG[]>([]);
  selectedOngIndex = signal(-1);

  ngOnInit() {
    // Initialize with translated "all cities" value
    this.translate.get('ongs.allCities').subscribe(translation => {
      this.currentLocation.set(translation);
      this.availableLocations = [translation];
      this.filteredLocations.set([translation]);
    });

    this.loadCitiesWithPets();
    this.loadAllOngsForTypeahead();
    this.loadOngs();

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.location-search-container')) {
        this.showLocationDropdown.set(false);
      }
      if (!target.closest('.search-container')) {
        this.showOngDropdown.set(false);
      }
    });
  }

  loadAllOngsForTypeahead() {
    // Load all ONGs without filters for typeahead
    this.usersService.getAllOngs().subscribe({
      next: (ongs) => {
        this.allOngs.set(ongs);
      },
      error: (error) => {
      },
    });
  }

  loadOngs() {
    this.loading.set(true);

    const filters: any = {};

    // IMPORTANT: Add country filter to show only ONGs from user's country
    filters.countryCode = this.countryService.getCountry();

    // Add search filter
    if (this.searchQuery()) {
      filters.search = this.searchQuery();
    }

    // Add location filter if selected and not "all cities"
    this.translate.get('ongs.allCities').subscribe(allCitiesTranslation => {
      if (
        this.currentLocation() &&
        this.currentLocation() !== allCitiesTranslation
      ) {
        filters.location = this.currentLocation();
      }

      this.usersService.getAllOngs(filters).subscribe({
        next: (ongs) => {
          this.ongs.set(ongs);
          this.loading.set(false);
        },
        error: (error) => {
          this.translate.get('ongs.errorLoadOngs').subscribe(msg => {
            this.toastService.error(msg);
          });
          this.loading.set(false);
          this.ongs.set([]);
        },
      });
    });
  }

  loadCitiesWithPets() {
    this.petsService.getCitiesWithPets().subscribe({
      next: (cities) => {
        this.translate.get('ongs.allCities').subscribe(allCitiesTranslation => {
          this.availableLocations = [allCitiesTranslation, ...cities];
          this.filteredLocations.set(this.availableLocations.slice(0, 5));
        });
      },
      error: (error) => {
      },
    });
  }

  onSearchInput(event: Event) {
    const input = (event.target as HTMLInputElement).value.trim();
    this.searchQuery.set(input);

    // Clear location filter when searching by ONG name
    if (input) {
      this.translate.get('ongs.allCities').subscribe(allCitiesTranslation => {
        this.currentLocation.set(allCitiesTranslation);
      });
    }

    if (!input) {
      this.showOngDropdown.set(false);
      this.filteredOngs.set([]);
      this.selectedOngIndex.set(-1);
      return;
    }

    // Filter ONGs by name OR location for typeahead
    const filtered = this.allOngs()
      .filter((ong) => {
        const nameMatch = ong.ongName.toLowerCase().includes(input.toLowerCase());
        const locationMatch = ong.location?.toLowerCase().includes(input.toLowerCase());
        return nameMatch || locationMatch;
      })
      .slice(0, 5);

    this.filteredOngs.set(filtered);
    this.showOngDropdown.set(true);
    this.selectedOngIndex.set(-1);
  }

  onSearchFocus() {
    const query = this.searchQuery();
    if (query) {
      const filtered = this.allOngs()
        .filter((ong) => {
          const nameMatch = ong.ongName.toLowerCase().includes(query.toLowerCase());
          const locationMatch = ong.location?.toLowerCase().includes(query.toLowerCase());
          return nameMatch || locationMatch;
        })
        .slice(0, 5);
      this.filteredOngs.set(filtered);
      this.showOngDropdown.set(true);
    }
  }

  onSearchKeydown(event: KeyboardEvent) {
    const ongs = this.filteredOngs();

    if (!this.showOngDropdown() || ongs.length === 0) {
      if (event.key === 'Enter') {
        this.onSearchEnter(event);
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedOngIndex.update((idx) =>
          idx < ongs.length - 1 ? idx + 1 : idx
        );
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.selectedOngIndex.update((idx) => (idx > 0 ? idx - 1 : -1));
        break;

      case 'Enter':
        event.preventDefault();
        const selectedIdx = this.selectedOngIndex();
        if (selectedIdx >= 0 && selectedIdx < ongs.length) {
          this.selectOng(ongs[selectedIdx]);
        } else {
          this.onSearchEnter(event);
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.showOngDropdown.set(false);
        this.selectedOngIndex.set(-1);
        break;
    }
  }

  selectOng(ong: ONG) {
    this.searchQuery.set(ong.ongName);
    this.showOngDropdown.set(false);
    this.selectedOngIndex.set(-1);
    this.loadOngs();
  }

  onSearchEnter(event?: Event) {
    if (event) {
      event.preventDefault();
      // Close mobile keyboard
      (event.target as HTMLInputElement).blur();
    }
    this.showOngDropdown.set(false);
    this.loadOngs();
  }

  getLocationInputValue(): string {
    let allCitiesValue = '';
    this.translate.get('ongs.allCities').subscribe(translation => {
      allCitiesValue = translation;
    });
    const location = this.currentLocation();
    return location === allCitiesValue ? '' : location;
  }

  getLocationPlaceholder(): string {
    let allCitiesValue = '';
    let typeCityValue = '';
    this.translate.get('ongs.allCities').subscribe(translation => {
      allCitiesValue = translation;
    });
    this.translate.get('ongs.typeCityName').subscribe(translation => {
      typeCityValue = translation;
    });
    const location = this.currentLocation();
    return location === allCitiesValue ? allCitiesValue : typeCityValue;
  }

  onLocationFocus() {
    this.filteredLocations.set(this.availableLocations.slice(0, 5));
    this.showLocationDropdown.set(true);
    this.selectedLocationIndex.set(-1);
  }

  onLocationInput(event: Event) {
    const input = (event.target as HTMLInputElement).value.trim();

    // Clear ONG search filter when selecting location
    if (input) {
      this.searchQuery.set('');
    }

    if (!input) {
      this.translate.get('ongs.allCities').subscribe(allCitiesTranslation => {
        this.currentLocation.set(allCitiesTranslation);
        this.filteredLocations.set(this.availableLocations.slice(0, 5));
        this.showLocationDropdown.set(true);
        this.selectedLocationIndex.set(-1);
      });
      return;
    }

    this.currentLocation.set(input);

    const filtered = this.availableLocations
      .filter((location) =>
        location.toLowerCase().includes(input.toLowerCase())
      )
      .slice(0, 5);

    this.filteredLocations.set(filtered);
    this.showLocationDropdown.set(true);
    this.selectedLocationIndex.set(-1);
  }

  onLocationKeydown(event: KeyboardEvent) {
    const locations = this.filteredLocations();

    if (!this.showLocationDropdown() || locations.length === 0) {
      if (event.key === 'Enter') {
        this.onLocationEnterKey();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedLocationIndex.update((idx) =>
          idx < locations.length - 1 ? idx + 1 : idx
        );
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.selectedLocationIndex.update((idx) => (idx > 0 ? idx - 1 : -1));
        break;

      case 'Enter':
        event.preventDefault();
        const selectedIdx = this.selectedLocationIndex();
        if (selectedIdx >= 0 && selectedIdx < locations.length) {
          this.selectLocation(locations[selectedIdx]);
        } else {
          this.onLocationEnterKey();
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.showLocationDropdown.set(false);
        this.selectedLocationIndex.set(-1);
        break;
    }
  }

  onLocationEnterKey() {
    this.showLocationDropdown.set(false);
    this.selectedLocationIndex.set(-1);

    this.translate.get('ongs.allCities').subscribe(allCitiesTranslation => {
      const input = this.currentLocation();
      if (!input || input === allCitiesTranslation) {
        this.currentLocation.set(allCitiesTranslation);
      }

      this.loadOngs();
    });
  }

  selectLocation(location: string) {
    this.currentLocation.set(location);
    this.showLocationDropdown.set(false);
    this.selectedLocationIndex.set(-1);
    this.filteredLocations.set(this.availableLocations.slice(0, 5));
    this.loadOngs();
  }

  viewOngDetail(ongId: string) {
    this.router.navigate(['/ongs', ongId]);
  }

  getCategoryLabel(category: string): string {
    const key = `ongs.categories.${category}`;
    return this.translate.instant(key) || this.translate.instant('ongs.categories.other');
  }

  getUrgencyColor(urgencyLevel?: string): string {
    const colors: any = {
      none: '#95a5a6',
      low: '#27ae60',
      medium: '#f39c12',
      high: '#e67e22',
      urgent: '#e74c3c',
    };
    return colors[urgencyLevel || 'none'];
  }

  getGreeting(): string {
    const user = this.authService.currentUser();
    if (user) {
      if (user.firstName) {
        return this.translate.instant('ongs.greetingWithName', { name: user.firstName });
      }
      if (user.ongName) {
        return this.translate.instant('ongs.greetingWithName', { name: user.ongName });
      }
    }
    return this.translate.instant('ongs.greeting');
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToDonate() {
    this.router.navigate(['/donations']);
  }
}
