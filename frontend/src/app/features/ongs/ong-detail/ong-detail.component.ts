import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ShareButtonComponent } from '../../../shared/components/share-button/share-button.component';
import { LanguageSelectorComponent } from '../../../shared/components/language-selector/language-selector.component';
import { ToastService } from '../../../core/services/toast.service';
import { GeolocationService } from '../../../core/services/geolocation.service';
import { environment } from '../../../../environments/environment';

export interface Need {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  targetAmount?: number;
  createdAt: string;
}

export interface OngDetail {
  id: string;
  ongName: string;
  email: string;
  profileImageUrl?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  instagramHandle?: string;
  allowAppointments: boolean;
  createdAt: string;
  petCount: number;
  needs: Need[];
}

@Component({
  selector: 'app-ong-detail',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, ShareButtonComponent, LanguageSelectorComponent],
  templateUrl: './ong-detail.component.html',
  styleUrl: './ong-detail.component.scss',
})
export class OngDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  geoService = inject(GeolocationService);

  ong = signal<OngDetail | null>(null);
  loading = signal(true);
  distance = signal<number | null>(null);

  shareData = computed(() => {
    const currentOng = this.ong();
    if (!currentOng) return undefined;

    return {
      title: currentOng.ongName,
      text: `Conheça a ${currentOng.ongName} - ${currentOng.petCount} pets disponíveis para adoção!`,
      url: window.location.href
    };
  });

  ngOnInit() {
    const ongId = this.route.snapshot.paramMap.get('id');
    if (ongId) {
      this.loadOngDetails(ongId);
    }
  }

  loadOngDetails(id: string) {
    this.loading.set(true);
    this.http
      .get<OngDetail>(`${environment.apiUrl}/users/${id}`)
      .subscribe({
        next: async (ong) => {
          this.ong.set(ong);
          this.loading.set(false);

          // Calculate distance if ONG has coordinates
          if (ong.latitude && ong.longitude) {
            const userCoords = await this.geoService.requestLocation();
            if (userCoords) {
              const dist = this.geoService.calculateDistance(
                userCoords,
                { latitude: ong.latitude, longitude: ong.longitude }
              );
              this.distance.set(dist);
            }
          }
        },
        error: (error) => {
          this.toastService.error('Erro ao carregar detalhes da ONG');
          this.loading.set(false);
          this.router.navigate(['/ongs']);
        },
      });
  }

  goBack() {
    this.router.navigate(['/ongs']);
  }

  getCategoryLabel(category: string): string {
    const labels: any = {
      food: 'Alimentos',
      medicine: 'Medicamentos',
      debt: 'Dívidas',
      supplies: 'Suprimentos',
      other: 'Outros',
    };
    return labels[category] || 'Outros';
  }

  getPriorityLabel(priority: string): string {
    const labels: any = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      urgent: 'URGENTE',
    };
    return labels[priority] || 'Média';
  }

  getPriorityColor(priority: string): string {
    const colors: any = {
      low: '#27ae60',
      medium: '#f39c12',
      high: '#e67e22',
      urgent: '#e74c3c',
    };
    return colors[priority] || '#f39c12';
  }

  getCategoryIcon(category: string): string {
    const icons: any = {
      food: '🍖',
      medicine: '💊',
      debt: '💰',
      supplies: '📦',
      other: '⚙️',
    };
    return icons[category] || '⚙️';
  }

  viewPets() {
    const ong = this.ong();
    if (ong) {
      this.router.navigate(['/home'], { queryParams: { ong: ong.id } });
    }
  }

  contactOng(type: 'phone' | 'email' | 'instagram') {
    const ong = this.ong();
    if (!ong) return;

    switch (type) {
      case 'phone':
        if (ong.phone) {
          window.location.href = `tel:${ong.phone}`;
        }
        break;
      case 'email':
        window.location.href = `mailto:${ong.email}`;
        break;
      case 'instagram':
        if (ong.instagramHandle) {
          window.open(
            `https://instagram.com/${ong.instagramHandle.replace('@', '')}`,
            '_blank'
          );
        }
        break;
    }
  }

  onShare(method: string) {
    const ong = this.ong();
    if (ong) {
      // TODO: Track share event when analytics service supports it
      // this.analyticsService.trackEvent(EventType.SHARE, {
      //   itemType: 'ong',
      //   itemId: ong.id,
      //   itemName: ong.ongName,
      //   shareMethod: method
      // });
      this.toastService.success('Link compartilhado!');
    }
  }
}
