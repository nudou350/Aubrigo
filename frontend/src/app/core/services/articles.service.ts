import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export enum ArticleCategory {
  FOOD = 'food',
  MEDICINE = 'medicine',
  DEBT = 'debt',
  SUPPLIES = 'supplies',
  OTHER = 'other',
}

export enum ArticlePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ArticleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface Article {
  id: string;
  ongId: string;
  title: string;
  description: string;
  category: ArticleCategory;
  priority: ArticlePriority;
  status: ArticleStatus;
  targetAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateArticleDto {
  title: string;
  description: string;
  category?: ArticleCategory;
  priority?: ArticlePriority;
  targetAmount?: number;
}

export interface UpdateArticleDto {
  title?: string;
  description?: string;
  category?: ArticleCategory;
  priority?: ArticlePriority;
  status?: ArticleStatus;
  targetAmount?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ArticlesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/articles`;

  create(createArticleDto: CreateArticleDto): Observable<Article> {
    return this.http.post<Article>(this.apiUrl, createArticleDto);
  }

  findAll(): Observable<Article[]> {
    return this.http.get<Article[]>(this.apiUrl);
  }

  findByOng(ongId: string): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}/ong/${ongId}`);
  }

  findMyArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}/my-articles`);
  }

  findOne(id: string): Observable<Article> {
    return this.http.get<Article>(`${this.apiUrl}/${id}`);
  }

  update(id: string, updateArticleDto: UpdateArticleDto): Observable<Article> {
    return this.http.put<Article>(`${this.apiUrl}/${id}`, updateArticleDto);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateStatus(id: string, status: ArticleStatus): Observable<Article> {
    return this.http.patch<Article>(`${this.apiUrl}/${id}/status`, { status });
  }
}
