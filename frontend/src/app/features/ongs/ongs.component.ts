import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { UsersService, ONG } from '../../core/services/users.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { PetsService } from '../../core/services/pets.service';

@Component({
  selector: 'app-ongs',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './ongs.component.html',
  styleUrl: './ongs.component.scss',
})
export class OngsComponent implements OnInit {
  private usersService = inject(UsersService);
  private petsService = inject(PetsService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  authService = inject(AuthService);

  ongs = signal<ONG[]>([]);
  loading = signal(true);
  searchQuery = signal('');
  currentLocation = signal('Todas as cidades');

  // Location typeahead
  showLocationDropdown = signal(false);
  availableLocations: string[] = ['Todas as cidades'];
  filteredLocations = signal<string[]>(this.availableLocations);
  selectedLocationIndex = signal(-1);

  ngOnInit() {
    this.loadCitiesWithPets();
    this.loadOngs();

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.location-search-container')) {
        this.showLocationDropdown.set(false);
      }
    });
  }

  loadOngs() {
    this.loading.set(true);

    const filters: any = {};

    // Add search filter
    if (this.searchQuery()) {
      filters.search = this.searchQuery();
    }

    // Add location filter if selected and not "Todas as cidades"
    if (
      this.currentLocation() &&
      this.currentLocation() !== 'Todas as cidades'
    ) {
      filters.location = this.currentLocation();
    }

    this.usersService.getAllOngs(filters).subscribe({
      next: (ongs) => {
        console.log('ONGs carregadas:', ongs);
        this.ongs.set(ongs);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading ONGs:', error);
        this.toastService.error('Erro ao carregar ONGs');
        this.loading.set(false);
        this.ongs.set([]);
      },
    });
  }

  loadCitiesWithPets() {
    this.petsService.getCitiesWithPets().subscribe({
      next: (cities) => {
        this.availableLocations = ['Todas as cidades', ...cities];
        this.filteredLocations.set(this.availableLocations.slice(0, 5));
      },
      error: (error) => {
        console.error('Error loading cities:', error);
      },
    });
  }

  onSearchInput(event: Event) {
    const input = (event.target as HTMLInputElement).value.trim();
    this.searchQuery.set(input);
  }

  onSearchEnter() {
    this.loadOngs();
  }

  getLocationInputValue(): string {
    const location = this.currentLocation();
    return location === 'Todas as cidades' ? '' : location;
  }

  getLocationPlaceholder(): string {
    const location = this.currentLocation();
    return location === 'Todas as cidades'
      ? 'Todas as cidades'
      : 'Digite uma cidade...';
  }

  onLocationFocus() {
    this.filteredLocations.set(this.availableLocations.slice(0, 5));
    this.showLocationDropdown.set(true);
    this.selectedLocationIndex.set(-1);
  }

  onLocationInput(event: Event) {
    const input = (event.target as HTMLInputElement).value.trim();

    if (!input) {
      this.currentLocation.set('Todas as cidades');
      this.filteredLocations.set(this.availableLocations.slice(0, 5));
      this.showLocationDropdown.set(true);
      this.selectedLocationIndex.set(-1);
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

    const input = this.currentLocation();
    if (!input || input === 'Todas as cidades') {
      this.currentLocation.set('Todas as cidades');
    }

    this.loadOngs();
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

  getCategoryLabel(category?: string): string {
    if (!category) return 'Sem Necessidades';

    const labels: any = {
      food: 'Alimentos',
      medicine: 'Medicamentos',
      debt: 'Dívidas',
      supplies: 'Suprimentos',
      other: 'Outros',
    };
    return labels[category] || 'Outros';
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

  hasUrgency(urgencyLevel?: string): boolean {
    // Always show badge
    return true;
  }

  getGreeting(): string {
    const user = this.authService.currentUser();
    if (user) {
      if (user.firstName) {
        return `Olá, ${user.firstName}!`;
      }
      if (user.ongName) {
        return `Olá, ${user.ongName}!`;
      }
    }
    return 'Olá!';
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
