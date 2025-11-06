import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../core/services/toast.service';
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
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './ong-detail.component.html',
  styleUrl: './ong-detail.component.scss',
})
export class OngDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  ong = signal<OngDetail | null>(null);
  loading = signal(true);

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
        next: (ong) => {
          this.ong.set(ong);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading ONG details:', error);
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
}
