import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  ArticlesService,
  Article,
  ArticleCategory,
  ArticlePriority,
  ArticleStatus,
  CreateArticleDto
} from '../../../core/services/articles.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-ong-articles',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  template: `
    <div class="articles-page">
      <a routerLink="/ong/dashboard" class="back-link">
        ← Voltar
      </a>
      <header class="page-header">
        <div>
          <h1>Necessidades da ONG</h1>
          <p>Gerencie os artigos e necessidades que sua ONG precisa</p>
        </div>
        <button class="btn-primary" (click)="openCreateForm()">
          ➕ Nova Necessidade
        </button>
      </header>

      @if (isLoading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Carregando necessidades...</p>
        </div>
      } @else {
        @if (showForm()) {
          <div class="form-modal">
            <div class="form-container">
              <div class="form-header">
                <h2>{{ isEditing() ? 'Editar Necessidade' : 'Nova Necessidade' }}</h2>
                <button class="btn-close" (click)="closeForm()">✕</button>
              </div>

              <form [formGroup]="articleForm" (ngSubmit)="onSubmit()">
                <div class="form-group">
                  <label for="title">Título *</label>
                  <input
                    id="title"
                    type="text"
                    formControlName="title"
                    class="form-input"
                    placeholder="Ex: Ração para cães"
                  />
                  @if (articleForm.get('title')?.invalid && articleForm.get('title')?.touched) {
                    <span class="form-error">Título é obrigatório</span>
                  }
                </div>

                <div class="form-group">
                  <label for="description">Descrição *</label>
                  <textarea
                    id="description"
                    formControlName="description"
                    class="form-textarea"
                    rows="4"
                    placeholder="Descreva a necessidade em detalhes..."
                  ></textarea>
                  @if (articleForm.get('description')?.invalid && articleForm.get('description')?.touched) {
                    <span class="form-error">Descrição é obrigatória</span>
                  }
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="category">Categoria</label>
                    <select id="category" formControlName="category" class="form-select">
                      <option value="food">🍖 Alimentação</option>
                      <option value="medicine">💊 Medicamentos</option>
                      <option value="debt">💰 Dívidas</option>
                      <option value="supplies">🛠️ Suprimentos</option>
                      <option value="other">📦 Outro</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label for="priority">Prioridade</label>
                    <select id="priority" formControlName="priority" class="form-select">
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                      <option value="urgent">🚨 Urgente</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label for="targetAmount">Valor Alvo (€) - Opcional</label>
                  <input
                    id="targetAmount"
                    type="number"
                    formControlName="targetAmount"
                    class="form-input"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                  <small class="form-hint">Para necessidades financeiras, informe o valor necessário</small>
                </div>

                <div class="form-actions">
                  <button type="button" class="btn-secondary" (click)="closeForm()">
                    Cancelar
                  </button>
                  <button type="submit" class="btn-primary" [disabled]="articleForm.invalid || isSaving()">
                    @if (isSaving()) {
                      <span class="spinner-small"></span>
                    } @else {
                      {{ isEditing() ? 'Salvar Alterações' : 'Criar Necessidade' }}
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        }

        @if (articles().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <h3>Nenhuma necessidade cadastrada</h3>
            <p>Comece criando sua primeira necessidade para que os visitantes saibam como podem ajudar</p>
            <button class="btn-primary" (click)="openCreateForm()">
              ➕ Criar Primeira Necessidade
            </button>
          </div>
        } @else {
          <div class="articles-grid">
            @for (article of articles(); track article.id) {
              <div class="article-card" [class.inactive]="article.status === 'inactive'">
                <div class="article-header">
                  <div class="category-badge" [class]="article.category">
                    {{ getCategoryIcon(article.category) }} {{ getCategoryLabel(article.category) }}
                  </div>
                  <div class="priority-badge" [class]="article.priority">
                    {{ getPriorityLabel(article.priority) }}
                  </div>
                </div>

                <h3>{{ article.title }}</h3>
                <p class="article-description">{{ article.description }}</p>

                @if (article.targetAmount) {
                  <div class="target-amount">
                    💰 Meta: €{{ formatAmount(article.targetAmount) }}
                  </div>
                }

                <div class="article-footer">
                  <div class="article-status">
                    @if (article.status === 'active') {
                      <span class="status-badge active">✓ Ativo</span>
                    } @else {
                      <span class="status-badge inactive">✕ Inativo</span>
                    }
                  </div>

                  <div class="article-actions">
                    <button
                      class="btn-icon"
                      (click)="toggleStatus(article)"
                      [title]="article.status === 'active' ? 'Desativar' : 'Ativar'"
                    >
                      {{ article.status === 'active' ? '👁️' : '👁️‍🗨️' }}
                    </button>
                    <button
                      class="btn-icon"
                      (click)="editArticle(article)"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      class="btn-icon danger"
                      (click)="deleteArticle(article)"
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .articles-page {
      padding: var(--spacing-lg);
      max-width: 1200px;
      margin: 0 auto;
    }

    .back-link {
      color: #5CB5B0;
      text-decoration: none;
      font-weight: 600;
      margin-bottom: 16px;
      display: inline-flex;
      align-items: center;
      gap: 4px;

      &:hover {
        text-decoration: underline;
      }
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xl);
    }

    .page-header h1 {
      color: var(--color-primary);
      margin-bottom: var(--spacing-xs);
    }

    .page-header p {
      color: var(--color-text-secondary);
      margin: 0;
    }

    .loading {
      text-align: center;
      padding: var(--spacing-xl);
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid var(--color-background-secondary);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto var(--spacing-md);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Form Modal */
    .form-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: var(--spacing-md);
    }

    .form-container {
      background: white;
      border-radius: var(--radius-lg);
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }

    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-lg);
      border-bottom: 1px solid var(--color-border);
    }

    .form-header h2 {
      margin: 0;
      color: var(--color-primary);
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: var(--color-text-secondary);
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      transition: all 0.2s;
    }

    .btn-close:hover {
      background: var(--color-background-secondary);
      color: var(--color-error);
    }

    form {
      padding: var(--spacing-lg);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-md);
    }

    .form-textarea {
      width: 100%;
      padding: var(--spacing-sm);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-family: inherit;
      font-size: var(--font-size-base);
      resize: vertical;
    }

    .form-actions {
      display: flex;
      gap: var(--spacing-md);
      justify-content: flex-end;
      margin-top: var(--spacing-lg);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: var(--spacing-xl) var(--spacing-lg);
      background: var(--color-background-secondary);
      border-radius: var(--radius-lg);
      margin-top: var(--spacing-lg);
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: var(--spacing-md);
    }

    .empty-state h3 {
      color: var(--color-text-primary);
      margin-bottom: var(--spacing-sm);
    }

    .empty-state p {
      color: var(--color-text-secondary);
      margin-bottom: var(--spacing-lg);
    }

    /* Articles Grid */
    .articles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: var(--spacing-lg);
    }

    @media (min-width: 769px) {
      .articles-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 1200px) {
      .articles-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .article-card {
      background: white;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--spacing-lg);
      transition: all 0.2s;
      display: flex;
      flex-direction: column;
      min-height: 250px;
    }

    .article-card.inactive {
      opacity: 0.6;
      background: var(--color-background-secondary);
    }

    .article-card:hover {
      border-color: var(--color-primary);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .article-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);
    }

    .category-badge {
      padding: 4px 12px;
      border-radius: var(--radius-full);
      font-size: var(--font-size-small);
      font-weight: var(--font-weight-medium);
    }

    .category-badge.food { background: #FFE4B5; color: #8B4513; }
    .category-badge.medicine { background: #E8F5E9; color: #2E7D32; }
    .category-badge.debt { background: #FFF3E0; color: #E65100; }
    .category-badge.supplies { background: #E3F2FD; color: #1565C0; }
    .category-badge.other { background: #F3E5F5; color: #6A1B9A; }

    .priority-badge {
      padding: 4px 12px;
      border-radius: var(--radius-full);
      font-size: var(--font-size-small);
      font-weight: var(--font-weight-semibold);
    }

    .priority-badge.low { background: #E8F5E9; color: #2E7D32; }
    .priority-badge.medium { background: #FFF9C4; color: #F57F17; }
    .priority-badge.high { background: #FFE0B2; color: #E65100; }
    .priority-badge.urgent { background: #FFCDD2; color: #C62828; }

    .article-card h3 {
      color: var(--color-text-primary);
      margin-bottom: var(--spacing-sm);
      font-size: var(--font-size-h3);
    }

    .article-description {
      color: var(--color-text-secondary);
      line-height: 1.6;
      margin-bottom: var(--spacing-md);
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      flex-grow: 1;
    }

    .target-amount {
      background: var(--color-primary-lighter);
      color: var(--color-primary);
      padding: var(--spacing-sm);
      border-radius: var(--radius-md);
      font-weight: var(--font-weight-semibold);
      margin-bottom: var(--spacing-md);
      text-align: center;
    }

    .article-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--color-border);
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: var(--radius-full);
      font-size: var(--font-size-small);
      font-weight: var(--font-weight-medium);
    }

    .status-badge.active {
      background: #E8F5E9;
      color: #2E7D32;
    }

    .status-badge.inactive {
      background: #FFEBEE;
      color: #C62828;
    }

    .article-actions {
      display: flex;
      gap: var(--spacing-xs);
    }

    .btn-icon {
      background: var(--color-background-secondary);
      border: none;
      padding: 8px;
      border-radius: var(--radius-md);
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: var(--color-primary);
      transform: scale(1.1);
    }

    .btn-icon.danger:hover {
      background: var(--color-error);
    }

    .spinner-small {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid white;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    /* Reduce button sizes */
    .btn-primary,
    .btn-secondary {
      padding: 10px 20px;
      font-size: 14px;
      height: auto;
      min-height: 36px;
      width: auto;
      display: inline-block;
    }

    .empty-state .btn-primary {
      padding: 12px 24px;
      font-size: 14px;
      width: auto;
      display: inline-block;
    }

    @media (max-width: 768px) {
      .articles-page {
        padding: var(--spacing-md);
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-md);
      }

      .articles-grid {
        grid-template-columns: 1fr;
      }

      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ArticlesComponent implements OnInit {
  private articlesService = inject(ArticlesService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  articles = signal<Article[]>([]);
  isLoading = signal(false);
  showForm = signal(false);
  isEditing = signal(false);
  isSaving = signal(false);
  editingArticle = signal<Article | null>(null);

  articleForm: FormGroup;

  constructor() {
    this.articleForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      category: [ArticleCategory.OTHER],
      priority: [ArticlePriority.MEDIUM],
      targetAmount: [null]
    });
  }

  ngOnInit(): void {
    this.loadArticles();
  }

  loadArticles(): void {
    this.isLoading.set(true);
    this.articlesService.findMyArticles().subscribe({
      next: (articles) => {
        this.articles.set(articles);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.toastService.error('Erro ao carregar necessidades');
        this.isLoading.set(false);
      }
    });
  }

  openCreateForm(): void {
    this.isEditing.set(false);
    this.editingArticle.set(null);
    this.articleForm.reset({
      category: ArticleCategory.OTHER,
      priority: ArticlePriority.MEDIUM
    });
    this.showForm.set(true);
  }

  editArticle(article: Article): void {
    this.isEditing.set(true);
    this.editingArticle.set(article);
    this.articleForm.patchValue({
      title: article.title,
      description: article.description,
      category: article.category,
      priority: article.priority,
      targetAmount: article.targetAmount
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.articleForm.reset();
  }

  onSubmit(): void {
    if (this.articleForm.invalid) {
      this.articleForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formValue = this.articleForm.value as CreateArticleDto;

    if (this.isEditing() && this.editingArticle()) {
      this.articlesService.update(this.editingArticle()!.id, formValue).subscribe({
        next: () => {
          this.toastService.success('Necessidade atualizada com sucesso!');
          this.closeForm();
          this.loadArticles();
          this.isSaving.set(false);
        },
        error: (error) => {
          this.toastService.error('Erro ao atualizar necessidade');
          this.isSaving.set(false);
        }
      });
    } else {
      this.articlesService.create(formValue).subscribe({
        next: () => {
          this.toastService.success('Necessidade criada com sucesso!');
          this.closeForm();
          this.loadArticles();
          this.isSaving.set(false);
        },
        error: (error) => {
          this.toastService.error('Erro ao criar necessidade');
          this.isSaving.set(false);
        }
      });
    }
  }

  toggleStatus(article: Article): void {
    const newStatus = article.status === ArticleStatus.ACTIVE
      ? ArticleStatus.INACTIVE
      : ArticleStatus.ACTIVE;

    this.articlesService.updateStatus(article.id, newStatus).subscribe({
      next: () => {
        this.toastService.success(
          `Necessidade ${newStatus === ArticleStatus.ACTIVE ? 'ativada' : 'desativada'}!`
        );
        this.loadArticles();
      },
      error: (error) => {
        this.toastService.error('Erro ao atualizar status');
      }
    });
  }

  deleteArticle(article: Article): void {
    if (!confirm(`Tem certeza que deseja excluir "${article.title}"?`)) {
      return;
    }

    this.articlesService.remove(article.id).subscribe({
      next: () => {
        this.toastService.success('Necessidade excluída com sucesso!');
        this.loadArticles();
      },
      error: (error) => {
        this.toastService.error('Erro ao excluir necessidade');
      }
    });
  }

  getCategoryLabel(category: ArticleCategory): string {
    const labels: Record<ArticleCategory, string> = {
      [ArticleCategory.FOOD]: 'Alimentação',
      [ArticleCategory.MEDICINE]: 'Medicamentos',
      [ArticleCategory.DEBT]: 'Dívidas',
      [ArticleCategory.SUPPLIES]: 'Suprimentos',
      [ArticleCategory.OTHER]: 'Outro'
    };
    return labels[category];
  }

  getCategoryIcon(category: ArticleCategory): string {
    const icons: Record<ArticleCategory, string> = {
      [ArticleCategory.FOOD]: '🍖',
      [ArticleCategory.MEDICINE]: '💊',
      [ArticleCategory.DEBT]: '💰',
      [ArticleCategory.SUPPLIES]: '🛠️',
      [ArticleCategory.OTHER]: '📦'
    };
    return icons[category];
  }

  getPriorityLabel(priority: ArticlePriority): string {
    const labels: Record<ArticlePriority, string> = {
      [ArticlePriority.LOW]: 'Baixa',
      [ArticlePriority.MEDIUM]: 'Média',
      [ArticlePriority.HIGH]: 'Alta',
      [ArticlePriority.URGENT]: '🚨 Urgente'
    };
    return labels[priority];
  }

  formatAmount(amount: any): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return numAmount ? numAmount.toFixed(2) : '0.00';
  }
}
