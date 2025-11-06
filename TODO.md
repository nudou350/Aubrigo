# TODO - Analytics & Sharing Implementation

## 📊 Projeto: Implementação Completa de Analytics e Funcionalidades de Partilha

**Data de Início:** 06/11/2025
**Status Geral:** Fase 1 Concluída ✅

---

## ✅ FASE 1 - IMPLEMENTAÇÃO DO BOTÃO DE PARTILHA (CONCLUÍDA)

**Status:** ✅ 100% Completo
**Data de Conclusão:** 06/11/2025
**Tempo Estimado:** 4-6h | **Tempo Real:** ~4h

### Tarefas Concluídas:

- [x] **Atualizar ShareButtonComponent para emitir eventos**
  - Adicionado `@Output() shareSuccess = new EventEmitter<string>()`
  - Método `handleNativeShare()` emite 'native' em sucesso
  - Método `handleShare()` emite platform name em sucesso
  - Corrigido uso do ToastService (`.success()` e `.error()`)
  - Arquivo: `frontend/src/app/shared/components/share-button/share-button.component.ts`

- [x] **Adicionar ShareButton à página de detalhe do pet**
  - Importado `ShareButtonComponent` e `computed`
  - Criado `shareData` computed signal com título, texto e URL do pet
  - Criado método `onShare(platform)` para tracking de analytics
  - Botão adicionado ao template no header (ao lado do favorito)
  - Estilização: botão circular 44x44px, teal, compacto
  - Arquivo: `frontend/src/app/features/pets/pet-detail/pet-detail.component.ts`

- [x] **Adicionar rota /share ao routing**
  - Rota `/share` adicionada com lazy loading
  - Conectada ao `ShareComponent`
  - Arquivo: `frontend/src/app/app.routes.ts`

- [x] **Corrigir TypeScript no ShareComponent**
  - Método `isPetUrl()` aceita `string | undefined`
  - Template usa optional chaining correto
  - Arquivo: `frontend/src/app/features/share/share.component.ts`

- [x] **Build e testes de compilação**
  - Build completado sem erros
  - Warnings menores (budget CSS) não críticos

### Resultados da Fase 1:

- ✅ Botão de partilha funcional na página de pet
- ✅ Tracking de analytics implementado (`PET_SHARE` event)
- ✅ 6 plataformas suportadas: Native, WhatsApp, Facebook, Twitter, Email, Copy
- ✅ Metadata capturada: platform, species, breed
- ✅ Dashboard analytics agora mostrará dados reais de compartilhamentos

---

## 🚧 FASE 2 - ANALYTICS FALTANTES (PENDENTE)

**Status:** ⏳ Não Iniciado
**Prioridade:** Alta
**Tempo Estimado:** 8-10h

### Tarefas Pendentes:

#### 2.1 Rastreamento de Pesquisas
- [ ] Adicionar tracking no componente Home quando usuário pesquisar pets
- [ ] Método: `analyticsService.trackSearch(query, resultsCount)`
- [ ] Capturar: termo de pesquisa, número de resultados, timestamp
- [ ] Arquivo: `frontend/src/app/features/home/home.component.ts`

#### 2.2 Rastreamento de Filtros
- [ ] Adicionar tracking quando filtros forem aplicados (espécie, localização)
- [ ] Método: `analyticsService.trackFilter({species, location})`
- [ ] Capturar: filtros selecionados, combinação de filtros
- [ ] Arquivo: `frontend/src/app/features/home/home.component.ts`

#### 2.3 Rastreamento de Page Views
- [ ] Implementar tracking de navegação entre páginas
- [ ] Ouvir eventos do Router (NavigationEnd)
- [ ] Método: `analyticsService.trackPageView(url)`
- [ ] Arquivo: `frontend/src/app/app.component.ts`

#### 2.4 Verificar/Adicionar Tracking de Doações
- [ ] Verificar se `DONATION_START` está sendo rastreado
- [ ] Verificar se `DONATION_COMPLETE` está sendo rastreado
- [ ] Adicionar se faltando em: `frontend/src/app/features/donations/donation.component.ts`

#### 2.5 Verificar Tracking de Cancelamento de Agendamentos
- [ ] Verificar se `APPOINTMENT_CANCEL` está sendo rastreado
- [ ] Adicionar se faltando em: `frontend/src/app/features/pets/schedule-appointment/`

---

## 🔧 FASE 3 - PWA ANALYTICS (PENDENTE)

**Status:** ⏳ Não Iniciado
**Prioridade:** Média
**Tempo Estimado:** 6-8h

### Tarefas Pendentes:

#### 3.1 Criar PWA Service
- [ ] Criar `frontend/src/app/core/services/pwa.service.ts`
- [ ] Injetar AnalyticsService e SwUpdate

#### 3.2 Rastrear Eventos PWA
- [ ] Event: `PWA_INSTALL` - quando app é instalado
- [ ] Event: `PWA_UNINSTALL` - detecção de desinstalação
- [ ] Event: `OFFLINE_MODE` - quando app entra/sai do modo offline
- [ ] Event: `SERVICE_WORKER_UPDATE` - quando service worker atualiza

#### 3.3 Integrar PWA Service
- [ ] Injetar PWAService no AppComponent para inicializar
- [ ] Adicionar listeners para eventos do navegador e service worker

---

## 📊 FASE 4 - MELHORIAS NO DASHBOARD (PENDENTE)

**Status:** ⏳ Não Iniciado
**Prioridade:** Média
**Tempo Estimado:** 8-10h

### Tarefas Pendentes:

#### 4.1 Breakdown de Compartilhamentos por Plataforma
- [ ] Criar endpoint backend: `GET /api/analytics/shares-by-platform`
- [ ] Query SQL para agrupar por `metadata.platform`
- [ ] Adicionar card no dashboard com lista de plataformas
- [ ] Arquivo backend: `backend/src/analytics/analytics.controller.ts`
- [ ] Arquivo frontend: `frontend/src/app/features/admin/analytics-dashboard/`

#### 4.2 Métricas por Período
- [ ] Adicionar comparação: Hoje vs. Ontem
- [ ] Adicionar comparação: Esta semana vs. Semana passada
- [ ] Adicionar comparação: Este mês vs. Mês passado
- [ ] Mostrar percentagem de mudança (↑ 15% ou ↓ 5%)

#### 4.3 Funil de Conversão
- [ ] Criar visualização de funil: Views → Favoritos → Agendamentos → Adoções
- [ ] Calcular taxas de conversão em cada etapa
- [ ] Mostrar percentagens e números absolutos

#### 4.4 Analytics de Pesquisa
- [ ] Card "Termos mais pesquisados"
- [ ] Card "Pesquisas sem resultados" (para melhorar catálogo)
- [ ] Filtros mais usados

---

## 🗄️ FASE 5 - BACKEND ENHANCEMENTS (PENDENTE)

**Status:** ⏳ Não Iniciado
**Prioridade:** Baixa
**Tempo Estimado:** 4-6h

### Tarefas Pendentes:

#### 5.1 Novos Endpoints de Analytics
- [ ] `GET /api/analytics/shares-by-platform?ongId=xxx&days=30`
- [ ] `GET /api/analytics/search-terms?ongId=xxx&days=30`
- [ ] `GET /api/analytics/filters-usage?ongId=xxx&days=30`
- [ ] `GET /api/analytics/conversion-funnel?ongId=xxx&days=30`
- [ ] `GET /api/analytics/pwa-stats?ongId=xxx&days=30`

#### 5.2 Otimizações de Performance
- [ ] Adicionar índices no banco de dados para queries de analytics
- [ ] Implementar cache Redis para queries frequentes
- [ ] Otimizar queries SQL para grandes volumes de dados

---

## 🧪 FASE 6 - TESTES E VALIDAÇÃO (PENDENTE)

**Status:** ⏳ Não Iniciado
**Prioridade:** Alta (antes de production)
**Tempo Estimado:** 6-8h

### Tarefas Pendentes:

#### 6.1 Testes Manuais - Funcionalidade de Partilha
- [ ] Testar botão de partilha na página de pet detail
- [ ] Testar Web Share API em mobile (Android/iOS)
- [ ] Testar cada plataforma: WhatsApp, Facebook, Twitter, Email, Copy
- [ ] Verificar texto e URL compartilhados estão corretos
- [ ] Verificar toast de sucesso aparece
- [ ] Verificar menu fecha após partilhar

#### 6.2 Testes de Analytics - Frontend
- [ ] Abrir DevTools Console e verificar logs de tracking
- [ ] Verificar eventos salvos no IndexedDB (`aubrigo_analytics`)
- [ ] Verificar POST requests para `/api/analytics/track`
- [ ] Verificar sincronização offline→online

#### 6.3 Testes de Analytics - Backend
- [ ] Verificar eventos chegam ao banco de dados
- [ ] Query direta: `SELECT * FROM analytics_events WHERE event_type='pet_share'`
- [ ] Verificar metadata está sendo salvo corretamente
- [ ] Verificar dashboard mostra dados corretos

#### 6.4 Testes Cross-Browser
- [ ] Chrome (Desktop + Mobile)
- [ ] Firefox (Desktop + Mobile)
- [ ] Safari (Desktop + Mobile)
- [ ] Edge

#### 6.5 Testes de Performance
- [ ] Lighthouse audit (PWA score > 90)
- [ ] Verificar bundle size não aumentou significativamente
- [ ] Verificar tempo de carregamento da página de pet detail

---

## 📈 MÉTRICAS DE SUCESSO

### Objetivos Técnicos:
- [x] ✅ Share tracking implementado e funcional
- [ ] ⏳ Todas as métricas de analytics capturadas
- [ ] ⏳ Dashboard mostrando todos os dados em tempo real
- [ ] ⏳ PWA events rastreados
- [ ] ⏳ Lighthouse PWA score > 90

### Objetivos de Negócio:
- [ ] ⏳ ONGs conseguem ver quais pets são mais compartilhados
- [ ] ⏳ ONGs entendem quais plataformas funcionam melhor
- [ ] ⏳ ONGs identificam pesquisas populares
- [ ] ⏳ ONGs otimizam catálogo baseado em dados

---

## 🐛 BUGS CONHECIDOS

Nenhum bug identificado no momento.

---

## 📝 NOTAS TÉCNICAS

### Arquitetura de Analytics:
- **Frontend:** Eventos capturados via `AnalyticsService`
- **Storage:** IndexedDB para offline-first
- **Sync:** Auto-sync a cada 5 minutos quando online
- **Backend:** Eventos salvos em PostgreSQL (`analytics_events` table)
- **Dashboard:** Queries agregadas para visualização

### Event Types Disponíveis:
```typescript
// ENGAGEMENT
PET_VIEW ✅           // Implementado
PET_FAVORITE ✅       // Implementado
PET_UNFAVORITE ✅     // Implementado
PET_SHARE ✅          // Implementado (Fase 1)

// CONVERSION
APPOINTMENT_CREATE ✅ // Implementado
APPOINTMENT_CANCEL ⚠️ // Precisa verificar
DONATION_START ⚠️     // Precisa verificar
DONATION_COMPLETE ⚠️  // Precisa verificar

// NAVIGATION
SEARCH ❌            // Fase 2
FILTER_APPLY ❌      // Fase 2
PAGE_VIEW ❌         // Fase 2

// TECHNICAL
PWA_INSTALL ❌       // Fase 3
PWA_UNINSTALL ❌     // Fase 3
OFFLINE_MODE ❌      // Fase 3
SERVICE_WORKER_UPDATE ❌ // Fase 3

// USER
USER_REGISTER ⚠️    // Precisa verificar
USER_LOGIN ⚠️       // Precisa verificar
USER_LOGOUT ⚠️      // Precisa verificar
```

### Estrutura de Evento:
```json
{
  "type": "pet_share",
  "petId": "uuid",
  "ongId": "uuid",
  "metadata": {
    "platform": "whatsapp",
    "species": "Dog",
    "breed": "Labrador"
  },
  "timestamp": 1730901234567,
  "offline": false
}
```

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

1. **Testar Fase 1 em desenvolvimento:**
   ```bash
   cd frontend && npm start
   ```
   - Navegar para um pet
   - Clicar em botão de partilha
   - Testar cada plataforma
   - Verificar logs no console

2. **Iniciar Fase 2:**
   - Implementar tracking de pesquisas
   - Implementar tracking de filtros
   - Implementar tracking de page views

3. **Documentação:**
   - Adicionar exemplos de uso no README
   - Documentar APIs de analytics para ONGs

---

## 📚 DOCUMENTAÇÃO RELACIONADA

- **Analytics Guide:** `frontend/docs/ANALYTICS_INTEGRATION_EXAMPLES.md`
- **Share API Guide:** `frontend/docs/SHARE_API_GUIDE.md`
- **Project Instructions:** `CLAUDE.md`

---

**Última Atualização:** 06/11/2025 - Fase 1 Concluída
**Atualizado por:** Claude Code
**Próxima Revisão:** Após conclusão da Fase 2
