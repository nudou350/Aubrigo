import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule, NgOptimizedImage } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BottomNavComponent } from "../../../shared/components/bottom-nav/bottom-nav.component";
import { ShareButtonComponent } from "../../../shared/components/share-button/share-button.component";
import { FavoritesService } from "../../../core/services/favorites.service";
import { ToastService } from "../../../core/services/toast.service";
import { PetsService } from "../../../core/services/pets.service";
import {
  ArticlesService,
  Article,
} from "../../../core/services/articles.service";
import { normalizeImageUrl } from "../../../core/utils/image-url.util";
import {
  AnalyticsService,
  EventType,
} from "../../../core/services/analytics.service";

interface PetImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
}

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  gender: string;
  size: string;
  color: string;
  weight: number;
  location: string;
  description: string;
  images: PetImage[];
  ong: {
    id: string;
    ongName: string;
    email: string;
    phone?: string;
    hasWhatsapp?: boolean;
    location: string;
    distance?: string;
    rating?: number;
    allowAppointments?: boolean;
    instagramHandle?: string;
  };
}

@Component({
  selector: "app-pet-detail",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    BottomNavComponent,
    NgOptimizedImage,
    ShareButtonComponent,
    TranslateModule,
  ],
  template: `
    <div class="pet-detail-screen">
      @if (loading()) {
      <div class="loading-container">
        <div class="loading">{{ 'common.loading' | translate }}</div>
      </div>
      } @else if (pet()) {
      <!-- Header with Back Button -->
      <div class="header">
        <button class="back-button" (click)="goBack()">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
            />
          </svg>
        </button>
        <h1 class="title">Conhecendo, {{ pet()!.name }}! :)</h1>
        <button
          class="favorite-button-header"
          [class.favorited]="isFavorited()"
          (click)="toggleFavorite()"
          [title]="'favorites.addedToFavorites' | translate"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            [attr.fill]="isFavorited() ? 'currentColor' : 'none'"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
        <!-- Share Button -->
        <app-share-button
          [shareData]="shareData()"
          [compact]="true"
          [buttonText]="''"
          [ariaLabel]="'Compartilhar ' + pet()!.name"
          (shareSuccess)="onShare($event)"
          class="share-button-header"
        >
        </app-share-button>
      </div>

      <!-- Image Carousel -->
      <div class="image-carousel">
        <div class="carousel-container">
          @if (imageLoadError()) {
          <div class="image-placeholder">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              class="placeholder-icon"
            >
              <path
                d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
              />
            </svg>
            <p class="placeholder-text">{{ pet()!.name }}</p>
            <span class="placeholder-subtext">{{ 'common.loading' | translate }}</span>
          </div>
          } @else {
          <img
            [ngSrc]="currentImage()"
            [alt]="pet()!.name"
            fill
            class="carousel-image"
            priority
            sizes="100vw"
            (error)="onImageError($event)"
            (load)="onImageLoad()"
          />
          } @if (pet()!.images.length > 1) {
          <button class="carousel-button prev" (click)="previousImage()">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>

          <button class="carousel-button next" (click)="nextImage()">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </button>

          <div class="carousel-indicators">
            @for (image of pet()!.images; track image.id; let i = $index) {
            <button
              class="indicator"
              [class.active]="currentImageIndex() === i"
              (click)="goToImage(i)"
            ></button>
            }
          </div>
          }
        </div>
      </div>

      <!-- Pet Info Banner -->
      <div class="info-banner">
        <span class="info-text"
          >{{ pet()!.breed }} | {{ 'home.petCard.years' | translate:{age: pet()!.age} }} |
          {{ pet()!.weight }} kg</span
        >
      </div>

      <!-- Content Section -->
      <div class="content-section">
        <!-- Description -->
        <div class="description-card">
          <p class="description-text">{{ pet()!.description }}</p>
        </div>

        <!-- ONG Info Section -->
        <div class="ong-section">
          <h3 class="section-title">{{ 'ongs.detail.contact' | translate }}</h3>

          <div class="ong-actions">
            @if (pet()!.ong.phone) { @if (pet()!.ong.hasWhatsapp) {
            <button
              class="action-button whatsapp"
              (click)="callOng()"
              aria-label="Conversar no WhatsApp"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
                />
              </svg>
            </button>
            } @else {
            <button
              class="action-button phone"
              (click)="callPhone()"
              aria-label="Ligar para ONG"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"
                />
              </svg>
            </button>
            } }
            <button
              class="action-button location"
              (click)="viewLocation()"
              aria-label="Ver localização"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                />
              </svg>
            </button>
            @if (pet()!.ong.instagramHandle) {
            <button
              class="action-button instagram"
              (click)="openInstagram()"
              aria-label="Ver Instagram da ONG"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.8,5.8 0 0,1 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.8,5.8 0 0,1 7.8,2M7.6,4A3.6,3.6 0 0,0 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4A3.6,3.6 0 0,0 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5A1.25,1.25 0 0,1 18.5,6.75A1.25,1.25 0 0,1 17.25,8A1.25,1.25 0 0,1 16,6.75A1.25,1.25 0 0,1 17.25,5.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z"
                />
              </svg>
            </button>
            }
          </div>
        </div>

        <!-- Schedule Visit Button -->
        @if (pet()!.ong.allowAppointments !== false) {
        <button class="schedule-button" (click)="scheduleVisit()">
          {{ 'pets.detail.scheduleVisit' | translate | uppercase }}
        </button>
        }

        <!-- ONG Articles/Needs Section -->
        @if (ongArticles().length > 0) {
        <div class="articles-section">
          <h3 class="articles-title">🤝 Como Você Pode Ajudar</h3>
          <div class="articles-list">
            @for (article of displayedArticles(); track article.id) {
            <div class="article-item" [class]="'priority-' + article.priority">
              <div class="article-header">
                <span class="article-icon">{{
                  getArticleIcon(article.category)
                }}</span>
                <span class="article-title-text">{{ article.title }}</span>
                @if (article.priority === 'urgent') {
                <span class="urgent-badge">URGENTE</span>
                }
              </div>
              <p class="article-description">{{ article.description }}</p>
              @if (article.targetAmount) {
              <div class="target-amount-badge">
                Meta: €{{ formatAmount(article.targetAmount) }}
              </div>
              }
            </div>
            }
          </div>
          @if (ongArticles().length > 3 && !showAllArticles()) {
          <button class="show-more-btn" (click)="toggleShowAllArticles()">
            Ver mais necessidades ({{ ongArticles().length - 3 }})
          </button>
          } @if (showAllArticles() && ongArticles().length > 3) {
          <button class="show-more-btn" (click)="toggleShowAllArticles()">
            Ver menos
          </button>
          }
        </div>
        }
      </div>
      } @else {
      <div class="error-container">
        <p class="error-text">{{ 'errors.notFound' | translate }}</p>
        <button class="back-to-home-button" (click)="goBack()">
          {{ 'common.back' | translate }}
        </button>
      </div>
      }

      <!-- Bottom Navigation -->
      <app-bottom-nav></app-bottom-nav>
    </div>
  `,
  styles: [
    `
      .pet-detail-screen {
        min-height: 100vh;
        background: #fafafa;
        padding-bottom: 80px;
      }

      .loading-container,
      .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        padding: 40px 20px;
      }

      .loading,
      .error-text {
        font-size: 16px;
        color: #666666;
        text-align: center;
      }

      .back-to-home-button {
        margin-top: 20px;
        background: #4ca8a0;
        color: #ffffff;
        border: none;
        border-radius: 12px;
        padding: 12px 24px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      /* Header */
      .header {
        background: #ffffff;
        padding: 18px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }

      .back-button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(184, 227, 225, 0.3);
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }

      .back-button svg {
        width: 24px;
        height: 24px;
        color: #4ca8a0;
      }

      .back-button:hover {
        background: rgba(184, 227, 225, 0.5);
      }

      .title {
        font-size: 20px;
        font-weight: 500;
        color: #4ca8a0;
        margin: 0;
        line-height: 1.3;
        flex: 1;
      }

      .favorite-button-header {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: rgba(184, 227, 225, 0.3);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        flex-shrink: 0;
        color: #666666;
      }

      .favorite-button-header:hover {
        background: rgba(184, 227, 225, 0.5);
        transform: scale(1.05);
      }

      .favorite-button-header.favorited {
        color: #e74c3c;
        background: #fff5f5;
      }

      .favorite-button-header:active {
        transform: scale(0.95);
      }

      .share-button-header {
        width: 44px;
        height: 44px;
      }

      .share-button-header ::ng-deep .share-btn {
        width: 44px;
        height: 44px;
        padding: 10px;
        border-radius: 50%;
        background: rgba(184, 227, 225, 0.3);
        border: 1px solid transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #4ca8a0;
      }

      .share-button-header ::ng-deep .share-btn:hover {
        background: rgba(184, 227, 225, 0.5);
        border-color: #4ca8a0;
        transform: scale(1.05);
      }

      .share-button-header ::ng-deep .share-btn:active {
        transform: scale(0.95);
      }

      /* Image Carousel */
      .image-carousel {
        background: #ffffff;
        padding: 0;
      }

      .carousel-container {
        position: relative;
        width: 100%;
        height: 380px;
        overflow: hidden;
        background: linear-gradient(
          135deg,
          #f5fafa 0%,
          #e8f5f4 50%,
          #b8e3e1 100%
        );
      }

      .carousel-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08));
      }

      .image-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%);
        gap: 12px;
      }

      .placeholder-icon {
        width: 80px;
        height: 80px;
        color: #4ca8a0;
        opacity: 0.5;
      }

      .placeholder-text {
        font-size: 24px;
        font-weight: 600;
        color: #4ca8a0;
        margin: 0;
      }

      .placeholder-subtext {
        font-size: 14px;
        color: #666666;
      }

      .carousel-button {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.9);
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      .carousel-button:hover {
        background: rgba(255, 255, 255, 1);
        transform: translateY(-50%) scale(1.1);
      }

      .carousel-button svg {
        width: 24px;
        height: 24px;
        color: #4ca8a0;
      }

      .carousel-button.prev {
        left: 12px;
      }

      .carousel-button.next {
        right: 12px;
      }

      .carousel-indicators {
        position: absolute;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 8px;
      }

      .indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
        padding: 0;
      }

      .indicator.active {
        background: #ffffff;
        width: 24px;
        border-radius: 4px;
      }

      /* Info Banner */
      .info-banner {
        background: #4ca8a0;
        padding: 12px 20px;
        text-align: center;
      }

      .info-text {
        font-size: 15px;
        font-weight: 500;
        color: #ffffff;
      }

      /* Content Section */
      .content-section {
        padding: 20px;
      }

      .description-card {
        background: #ffffff;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }

      .description-text {
        font-size: 15px;
        line-height: 1.6;
        color: #666666;
        margin: 0;
      }

      /* ONG Section */
      .ong-section {
        background: transparent;
        margin-bottom: 24px;
      }

      .section-title {
        font-size: 18px;
        font-weight: 600;
        color: #2c2c2c;
        margin: 0 0 16px 0;
      }

      .ong-actions {
        display: flex;
        gap: 12px;
      }

      .action-button {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
      }

      .action-button svg {
        width: 26px;
        height: 26px;
        color: #ffffff;
      }

      .action-button.whatsapp {
        background: #25d366;
      }

      .action-button.phone {
        background: #5cb5b0;
      }

      .action-button.location {
        background: #4ca8a0;
      }

      .action-button.instagram {
        background: linear-gradient(
          45deg,
          #f09433 0%,
          #e6683c 25%,
          #dc2743 50%,
          #cc2366 75%,
          #bc1888 100%
        );
      }

      .action-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(76, 168, 160, 0.3);
      }

      .action-button.whatsapp:hover {
        box-shadow: 0 5px 15px rgba(37, 211, 102, 0.4);
      }

      .action-button.phone:hover {
        box-shadow: 0 5px 15px rgba(92, 181, 176, 0.4);
      }

      .action-button.instagram:hover {
        box-shadow: 0 5px 15px rgba(225, 48, 108, 0.4);
      }

      .action-button:active {
        transform: translateY(0);
      }

      /* Schedule Button */
      .schedule-button {
        width: 100%;
        background: #4ca8a0;
        color: #ffffff;
        border: none;
        border-radius: 12px;
        padding: 16px;
        font-size: 16px;
        font-weight: 600;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(76, 168, 160, 0.3);
      }

      .schedule-button:hover {
        background: #3d9690;
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(76, 168, 160, 0.4);
      }

      /* Articles Section */
      .articles-section {
        margin-top: 24px;
        background: rgba(184, 227, 225, 0.15);
        border-radius: 12px;
        padding: 20px;
        border-left: 4px solid #4ca8a0;
      }

      .articles-title {
        font-size: 16px;
        font-weight: 600;
        color: #4ca8a0;
        margin: 0 0 16px 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .articles-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .article-item {
        background: white;
        border-radius: 8px;
        padding: 14px;
        border-left: 3px solid transparent;
        transition: all 0.2s ease;
      }

      .article-item.priority-low {
        border-left-color: #81c784;
      }

      .article-item.priority-medium {
        border-left-color: #ffb74d;
      }

      .article-item.priority-high {
        border-left-color: #ff8a65;
      }

      .article-item.priority-urgent {
        border-left-color: #e57373;
        background: #ffebee;
      }

      .article-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        flex-wrap: wrap;
      }

      .article-icon {
        font-size: 18px;
        line-height: 1;
      }

      .article-title-text {
        font-size: 14px;
        font-weight: 600;
        color: #2c2c2c;
        flex: 1;
      }

      .urgent-badge {
        background: #e57373;
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.5px;
      }

      .article-description {
        font-size: 13px;
        line-height: 1.5;
        color: #666666;
        margin: 0 0 8px 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .target-amount-badge {
        background: rgba(76, 168, 160, 0.1);
        color: #4ca8a0;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        display: inline-block;
      }

      .show-more-btn {
        width: 100%;
        background: transparent;
        color: #4ca8a0;
        border: 1px solid #4ca8a0;
        border-radius: 8px;
        padding: 10px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        margin-top: 12px;
        transition: all 0.2s ease;
      }

      .show-more-btn:hover {
        background: rgba(76, 168, 160, 0.1);
      }

      /* Responsive Design */
      @media (min-width: 768px) {
        .pet-detail-screen {
          padding-top: 18px;
        }

        .carousel-container {
          height: 480px;
        }

        .content-section {
          max-width: 768px;
          margin: 0 auto;
          padding: 32px;
        }

        .title {
          font-size: 24px;
        }
      }

      @media (min-width: 1024px) {
        .pet-detail-screen {
          max-width: 1440px;
          margin: 0 auto;
        }

        .carousel-container {
          height: 560px;
          max-height: 70vh;
        }

        .content-section {
          max-width: 900px;
        }
      }
    `,
  ],
})
export class PetDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private petsService = inject(PetsService);
  private favoritesService = inject(FavoritesService);
  private toastService = inject(ToastService);
  private articlesService = inject(ArticlesService);
  private analyticsService = inject(AnalyticsService);
  private translate = inject(TranslateService);

  pet = signal<Pet | null>(null);
  loading = signal(true);
  currentImageIndex = signal(0);
  currentImage = signal("");
  imageLoadError = signal(false);
  favoritedPetId = signal<string | null>(null);
  visitorEmail: string | null = null;
  ongArticles = signal<Article[]>([]);
  showAllArticles = signal(false);

  shareData = computed(() => {
    const currentPet = this.pet();
    if (!currentPet) return undefined;

    const petUrl = `${window.location.origin}/pets/${currentPet.id}`;
    return {
      title: `Conheça ${currentPet.name}!`,
      text: `${currentPet.name} está esperando por uma família no Aubrigo. ${currentPet.breed}, ${currentPet.age} anos. Veja mais detalhes!`,
      url: petUrl,
    };
  });

  ngOnInit() {
    const petId = this.route.snapshot.paramMap.get("id");
    if (petId) {
      this.loadPetDetail(petId);
      this.initFavorites(petId);
    }
  }

  initFavorites(petId: string) {
    // Get or create visitor email
    this.visitorEmail = this.favoritesService.getVisitorEmail();

    if (!this.visitorEmail) {
      // Generate a temporary email for anonymous users
      const tempEmail = `temp-${Date.now()}@petsos.com`;
      this.favoritesService.setVisitorEmail(tempEmail);
      this.visitorEmail = tempEmail;
    }

    // Check if this pet is favorited
    this.checkIfFavorited(petId);
  }

  checkIfFavorited(petId: string) {
    if (!this.visitorEmail) return;

    this.favoritesService.isFavorite(petId, this.visitorEmail).subscribe({
      next: (response) => {
        if (response.isFavorite) {
          this.favoritedPetId.set(petId);
        }
      },
      error: (error) => {
      },
    });
  }

  isFavorited(): boolean {
    const pet = this.pet();
    return pet ? this.favoritedPetId() === pet.id : false;
  }

  toggleFavorite() {
    const pet = this.pet();
    if (!pet || !this.visitorEmail) return;

    if (this.isFavorited()) {
      // Remove from favorites
      this.favoritesService
        .removeFavoriteByPetId(pet.id, this.visitorEmail)
        .subscribe({
          next: () => {
            this.favoritedPetId.set(null);
            this.toastService.success(this.translate.instant('favorites.removedFromFavorites'));

            // Track unfavorite
            this.analyticsService.track(EventType.PET_UNFAVORITE, {
              petId: pet.id,
              ongId: pet.ong?.id,
            });
          },
          error: (error) => {
            this.toastService.error(this.translate.instant('favorites.errorRemove'));
          },
        });
    } else {
      // Add to favorites
      this.favoritesService
        .addToFavorites(pet.id, this.visitorEmail)
        .subscribe({
          next: () => {
            this.favoritedPetId.set(pet.id);
            this.toastService.success(this.translate.instant('favorites.addedToFavorites'));

            // Track favorite
            this.analyticsService.track(EventType.PET_FAVORITE, {
              petId: pet.id,
              ongId: pet.ong?.id,
            });
          },
          error: (error) => {
            this.toastService.error(this.translate.instant('favorites.errorAdd'));
          },
        });
    }
  }

  loadPetDetail(petId: string) {
    this.loading.set(true);
    this.petsService.getPetById(petId).subscribe({
      next: (petData) => {
        this.pet.set(petData as any);

        // Set initial image
        if (petData.images && petData.images.length > 0) {
          const primaryImageIndex = petData.images.findIndex(
            (img) => img.isPrimary
          );
          const initialIndex = primaryImageIndex >= 0 ? primaryImageIndex : 0;
          this.currentImageIndex.set(initialIndex);
          this.currentImage.set(
            normalizeImageUrl(petData.images[initialIndex].imageUrl)
          );
        }

        // Track pet view
        this.analyticsService.track(EventType.PET_VIEW, {
          petId: petData.id,
          ongId: petData.ong?.id,
          metadata: {
            species: petData.species,
            breed: petData.breed,
            age: petData.age,
          },
        });

        // Load ONG articles
        if (petData.ong?.id) {
          this.loadOngArticles(petData.ong.id);
        }

        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.pet.set(null);
      },
    });
  }

  loadOngArticles(ongId: string) {
    this.articlesService.findByOng(ongId).subscribe({
      next: (articles) => {
        this.ongArticles.set(articles);
      },
      error: (error) => {
      },
    });
  }

  displayedArticles() {
    const articles = this.ongArticles();
    if (this.showAllArticles() || articles.length <= 3) {
      return articles;
    }
    return articles.slice(0, 3);
  }

  toggleShowAllArticles() {
    this.showAllArticles.set(!this.showAllArticles());
  }

  onShare(platform: string) {
    const pet = this.pet();
    if (!pet) return;


    // Track share analytics
    this.analyticsService.track(EventType.PET_SHARE, {
      petId: pet.id,
      ongId: pet.ong?.id,
      metadata: {
        platform,
        species: pet.species,
        breed: pet.breed,
      },
    });

    this.toastService.success(this.translate.instant('pets.detail.share'));
  }

  getArticleIcon(category: string): string {
    const icons: Record<string, string> = {
      food: "🍖",
      medicine: "💊",
      debt: "💰",
      supplies: "🛠️",
      other: "📦",
    };
    return icons[category] || "📦";
  }

  nextImage() {
    const pet = this.pet();
    if (!pet || !pet.images.length) return;

    const nextIndex = (this.currentImageIndex() + 1) % pet.images.length;
    this.currentImageIndex.set(nextIndex);
    this.currentImage.set(normalizeImageUrl(pet.images[nextIndex].imageUrl));
    this.imageLoadError.set(false);
  }

  previousImage() {
    const pet = this.pet();
    if (!pet || !pet.images.length) return;

    const prevIndex =
      this.currentImageIndex() === 0
        ? pet.images.length - 1
        : this.currentImageIndex() - 1;
    this.currentImageIndex.set(prevIndex);
    this.currentImage.set(normalizeImageUrl(pet.images[prevIndex].imageUrl));
    this.imageLoadError.set(false);
  }

  goToImage(index: number) {
    const pet = this.pet();
    if (!pet || !pet.images.length) return;

    this.currentImageIndex.set(index);
    this.currentImage.set(normalizeImageUrl(pet.images[index].imageUrl));
    this.imageLoadError.set(false);
  }

  goBack() {
    this.router.navigate(["/home"]);
  }

  callOng() {
    const pet = this.pet();
    if (pet?.ong.phone) {
      // Format phone number (remove spaces, dashes, parentheses)
      const phoneNumber = pet.ong.phone.replace(/[\s\-\(\)]/g, "");

      // Create WhatsApp message
      const message = `Olá! Vi o ${pet.name} no Aubrigo e gostaria de saber mais informações sobre a adoção.`;
      const encodedMessage = encodeURIComponent(message);

      // Try to open WhatsApp (works on both mobile and desktop)
      // WhatsApp will open if available, otherwise user will be redirected to WhatsApp Web
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

      // Open WhatsApp in a new window/tab
      const whatsappWindow = window.open(whatsappUrl, "_blank");

      // Fallback to phone call if user blocks popup or WhatsApp is not available
      // This timeout gives time for WhatsApp to open
      setTimeout(() => {
        if (!whatsappWindow || whatsappWindow.closed) {
          window.location.href = `tel:${pet.ong.phone}`;
        }
      }, 1000);
    }
  }

  callPhone() {
    const pet = this.pet();
    if (pet?.ong.phone) {
      // Direct phone call
      window.location.href = `tel:${pet.ong.phone}`;
    }
  }

  viewLocation() {
    const pet = this.pet();
    if (pet?.ong.location) {
      // Open Google Maps with the ONG location
      const encodedLocation = encodeURIComponent(pet.ong.location);
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`,
        "_blank"
      );
    }
  }

  openInstagram() {
    const pet = this.pet();
    if (pet?.ong.instagramHandle) {
      // Remove @ if present and open Instagram profile
      const handle = pet.ong.instagramHandle.replace("@", "");
      window.open(`https://www.instagram.com/${handle}`, "_blank");
    }
  }

  scheduleVisit() {
    const pet = this.pet();
    if (pet) {
      this.router.navigate(["/pets", pet.id, "schedule"]);
    }
  }

  onImageError(event: Event) {
    this.imageLoadError.set(true);
  }

  onImageLoad() {
    this.imageLoadError.set(false);
  }

  formatAmount(amount: any): string {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return numAmount ? numAmount.toFixed(2) : "0.00";
  }
}
