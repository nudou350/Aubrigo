import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonType = 'text' | 'circle' | 'rectangle' | 'card' | 'pet-card';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="skeleton-wrapper">
      @switch (type) {
        @case ('text') {
          <div class="skeleton skeleton-text" [style.width]="width" [style.height]="height"></div>
        }
        @case ('circle') {
          <div class="skeleton skeleton-circle" [style.width]="width" [style.height]="width"></div>
        }
        @case ('rectangle') {
          <div class="skeleton skeleton-rectangle" [style.width]="width" [style.height]="height"></div>
        }
        @case ('card') {
          <div class="skeleton-card">
            <div class="skeleton skeleton-rectangle skeleton-card-image"></div>
            <div class="skeleton-card-content">
              <div class="skeleton skeleton-text skeleton-card-title"></div>
              <div class="skeleton skeleton-text skeleton-card-text"></div>
              <div class="skeleton skeleton-text skeleton-card-text skeleton-card-text-short"></div>
            </div>
          </div>
        }
        @case ('pet-card') {
          <div class="skeleton-pet-card">
            <div class="skeleton skeleton-rectangle skeleton-pet-image"></div>
            <div class="skeleton-pet-info">
              <div class="skeleton skeleton-text skeleton-pet-name"></div>
              <div class="skeleton-pet-details">
                <div class="skeleton skeleton-text skeleton-detail-item"></div>
                <div class="skeleton skeleton-text skeleton-detail-item"></div>
                <div class="skeleton skeleton-text skeleton-detail-item"></div>
                <div class="skeleton skeleton-text skeleton-detail-item"></div>
              </div>
              <div class="skeleton skeleton-text skeleton-pet-ong"></div>
              <div class="skeleton skeleton-text skeleton-pet-description"></div>
              <div class="skeleton skeleton-text skeleton-pet-description skeleton-pet-description-short"></div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .skeleton-wrapper {
      width: 100%;
    }

    .skeleton {
      background: linear-gradient(
        90deg,
        #f0f0f0 0%,
        #e0e0e0 20%,
        #f0f0f0 40%,
        #f0f0f0 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
      border-radius: 4px;
    }

    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }

    .skeleton-text {
      height: 16px;
      margin-bottom: 8px;
    }

    .skeleton-circle {
      border-radius: 50%;
    }

    .skeleton-rectangle {
      border-radius: 8px;
    }

    /* Card Skeleton */
    .skeleton-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .skeleton-card-image {
      width: 100%;
      height: 200px;
      border-radius: 0;
    }

    .skeleton-card-content {
      padding: 20px;
    }

    .skeleton-card-title {
      height: 24px;
      width: 60%;
      margin-bottom: 12px;
    }

    .skeleton-card-text {
      height: 16px;
      width: 100%;
      margin-bottom: 8px;
    }

    .skeleton-card-text-short {
      width: 70%;
    }

    /* Pet Card Skeleton */
    .skeleton-pet-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .skeleton-pet-image {
      width: 100%;
      height: 280px;
      border-radius: 0;
    }

    .skeleton-pet-info {
      padding: 20px;
    }

    .skeleton-pet-name {
      height: 28px;
      width: 50%;
      margin-bottom: 16px;
    }

    .skeleton-pet-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }

    .skeleton-detail-item {
      height: 20px;
      width: 100%;
    }

    .skeleton-pet-ong {
      height: 20px;
      width: 60%;
      margin-bottom: 12px;
    }

    .skeleton-pet-description {
      height: 16px;
      width: 100%;
      margin-bottom: 8px;
    }

    .skeleton-pet-description-short {
      width: 80%;
    }
  `],
})
export class SkeletonComponent {
  @Input() type: SkeletonType = 'text';
  @Input() width: string = '100%';
  @Input() height: string = '16px';
  @Input() count: number = 1;
}
