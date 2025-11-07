# Plano de Desenvolvimento de Testes - Aubrigo

## Ordem de Implementação

### Fase 1: Fundação (Autenticação e Usuários)
### Fase 2: Core Business (ONGs e Pets)
### Fase 3: Funcionalidades de Interação (Favoritos, Agendamentos)
### Fase 4: Monetização e Conteúdo (Doações, Artigos)
### Fase 5: Administração e Analytics

---

## FASE 1: FUNDAÇÃO

### 1.1 Autenticação (Auth Module) ✅ COMPLETO

#### Testes Unitários - `auth.service.spec.ts` ✅
- **Registro de Usuário:**
  - ✓ Criar usuário com dados válidos
  - ✓ Rejeitar email duplicado
  - ✓ Validar formato de email inválido
  - ✓ Rejeitar senha fraca (< 8 caracteres)
  - ✓ Hash de senha é gerado corretamente
  - ✓ Não retornar senha no objeto de resposta

- **Login:**
  - ✓ Login bem-sucedido com credenciais corretas
  - ✓ Rejeitar email inexistente
  - ✓ Rejeitar senha incorreta
  - ✓ Gerar JWT token válido
  - ✓ Token contém userId e email corretos
  - ✓ Token expira após tempo definido

- **Recuperação de Senha:**
  - ✓ Enviar email com token de reset
  - ✓ Validar email existe na base de dados
  - ✓ Gerar token único e seguro
  - ✓ Token expira após 1 hora
  - ✓ Reset de senha com token válido
  - ✓ Rejeitar token expirado
  - ✓ Rejeitar token já utilizado

#### Testes de Integração - `auth.controller.spec.ts` ✅
- **POST /api/auth/register:**
  - ✓ 201: Registro bem-sucedido retorna token
  - ✓ 400: Email já cadastrado
  - ✓ 400: Dados inválidos (validação DTO)
  - ✓ 500: Erro ao enviar email de boas-vindas

- **POST /api/auth/login:**
  - ✓ 200: Login retorna token e dados do usuário
  - ✓ 401: Credenciais inválidas
  - ✓ 400: Dados de entrada inválidos

- **POST /api/auth/forgot-password:**
  - ✓ 200: Email enviado com sucesso
  - ✓ 404: Email não encontrado
  - ✓ 429: Rate limit (máx 3 tentativas/hora)

- **POST /api/auth/reset-password:**
  - ✓ 200: Senha alterada com sucesso
  - ✓ 400: Token inválido ou expirado
  - ✓ 400: Nova senha não atende requisitos

#### Testes E2E - `auth.e2e-spec.ts` ✅
- ✓ Fluxo completo: Registro → Login → Acesso protegido
- ✓ Fluxo completo: Forgot password → Reset → Login
- ✓ Proteção de rotas autenticadas sem token
- ✓ Refresh token após expiração

---

### 1.2 Usuários (Users Module) ✅ COMPLETO

#### Testes Unitários - `users.service.spec.ts` ✅
- **Perfil de Usuário:**
  - ✓ Buscar perfil por ID
  - ✓ Atualizar dados do perfil
  - ✓ Não permitir alterar email para email existente
  - ✓ Validar campos obrigatórios na atualização
  - ✓ Upload de imagem de perfil
  - ✓ Validar tipos de arquivo permitidos (jpg, png, webp)
  - ✓ Rejeitar arquivos > 5MB

- **Listagem:**
  - ✓ Listar todos os usuários (admin)
  - ✓ Filtrar por tipo de usuário
  - ✓ Paginação funciona corretamente

#### Testes de Integração - `users.controller.spec.ts` ✅
- **GET /api/users/profile:**
  - ✓ 200: Retorna perfil do usuário autenticado
  - ✓ 401: Rejeitar sem token de autenticação

- **PUT /api/users/profile:**
  - ✓ 200: Atualização bem-sucedida
  - ✓ 400: Dados inválidos
  - ✓ 401: Sem autenticação
  - ✓ 409: Email já em uso

- **POST /api/users/profile/image:**
  - ✓ 200: Upload bem-sucedido retorna URL da imagem
  - ✓ 400: Tipo de arquivo inválido
  - ✓ 413: Arquivo muito grande
  - ✓ 401: Sem autenticação

#### Testes E2E - `users.e2e-spec.ts` ✅
- ✓ Fluxo completo: Login → Ver perfil → Editar → Upload imagem

---

## FASE 2: CORE BUSINESS

### 2.1 ONGs (Ongs Module) ✅ COMPLETO

#### Testes Unitários - `ongs.service.spec.ts` ✅
- **Gestão de ONGs:**
  - ✓ Criar perfil de ONG
  - ✓ Atualizar informações da ONG
  - ✓ Buscar ONG por ID
  - ✓ Listar todas as ONGs (com paginação)
  - ✓ Filtrar por localização
  - ✓ Calcular distância entre usuário e ONG
  - ✓ Ordenar por proximidade

- **Horários de Funcionamento:**
  - ✓ Adicionar horário de funcionamento
  - ✓ Atualizar horário existente
  - ✓ Remover horário
  - ✓ Validar horário (abertura < fechamento)
  - ✓ Não permitir sobreposição de horários

- **Configurações de Agendamento:**
  - ✓ Definir duração padrão de visita
  - ✓ Definir intervalo entre agendamentos
  - ✓ Definir antecedência mínima/máxima
  - ✓ Habilitar/desabilitar agendamentos online

- **Exceções de Disponibilidade:**
  - ✓ Adicionar feriado/fechamento
  - ✓ Remover exceção
  - ✓ Listar exceções futuras

- **Slots Disponíveis:**
  - ✓ Calcular slots disponíveis para um dia
  - ✓ Considerar horário de funcionamento
  - ✓ Excluir horários já agendados
  - ✓ Considerar exceções (feriados)
  - ✓ Respeitar antecedência mínima

#### Testes de Integração - `ongs.controller.spec.ts` ✅
- **GET /api/ongs:**
  - ✓ 200: Lista paginada de ONGs
  - ✓ 200: Filtrar por localização (query params)
  - ✓ 200: Ordenar por distância

- **GET /api/ongs/:id:**
  - ✓ 200: Retorna detalhes completos da ONG
  - ✓ 404: ONG não encontrada

- **PUT /api/ongs/:id:**
  - ✓ 200: Atualização bem-sucedida
  - ✓ 401: Sem autenticação
  - ✓ 403: Usuário não é dono da ONG
  - ✓ 400: Dados inválidos

- **POST /api/ongs/:id/operating-hours:**
  - ✓ 201: Horário criado com sucesso
  - ✓ 400: Horário inválido (abertura >= fechamento)
  - ✓ 409: Sobreposição de horários

- **GET /api/ongs/:id/available-slots:**
  - ✓ 200: Lista de slots disponíveis para o dia
  - ✓ 400: Data inválida (no passado)
  - ✓ 200: Array vazio se não há slots disponíveis

#### Testes E2E - `ongs.e2e-spec.ts` ✅
- ✓ Fluxo completo: Criar ONG → Configurar horários → Verificar slots
- ✓ Fluxo de busca: Buscar ONGs próximas → Ver detalhes

---

### 2.2 Pets (Pets Module)

#### Testes Unitários - `pets.service.spec.ts`
- **Gestão de Pets:**
  - ✓ Criar pet com dados válidos
  - ✓ Atualizar informações do pet
  - ✓ Remover pet (soft delete)
  - ✓ Buscar pet por ID com imagens
  - ✓ Listar pets da ONG
  - ✓ Validar campos obrigatórios (nome, espécie, etc)

- **Listagem e Filtros:**
  - ✓ Listar todos os pets disponíveis
  - ✓ Filtrar por espécie (Dog, Cat, Fish, etc)
  - ✓ Filtrar por tamanho (Small, Medium, Large)
  - ✓ Filtrar por gênero (Male, Female)
  - ✓ Filtrar por faixa etária
  - ✓ Filtrar por localização/distância
  - ✓ Busca por texto livre (nome, raça, descrição)
  - ✓ Paginação funciona corretamente
  - ✓ Ordenar por: data, idade, distância

- **Imagens de Pets:**
  - ✓ Upload de múltiplas imagens (max 5)
  - ✓ Definir imagem principal
  - ✓ Reordenar imagens (display_order)
  - ✓ Remover imagem
  - ✓ Validar tipo de arquivo
  - ✓ Otimizar e gerar thumbnail

- **Status do Pet:**
  - ✓ Alterar status (available → pending → adopted)
  - ✓ Não permitir reverter de "adopted" sem permissão
  - ✓ Registrar histórico de mudanças de status

#### Testes de Integração - `pets.controller.spec.ts`
- **GET /api/pets:**
  - ✓ 200: Lista paginada de pets
  - ✓ 200: Filtros múltiplos funcionam (species + size + gender)
  - ✓ 200: Busca por texto retorna resultados relevantes
  - ✓ 200: Ordenação funciona corretamente

- **GET /api/pets/:id:**
  - ✓ 200: Retorna pet com imagens e dados da ONG
  - ✓ 404: Pet não encontrado
  - ✓ 200: Inclui informações de contato da ONG

- **POST /api/pets:**
  - ✓ 201: Pet criado com sucesso
  - ✓ 401: Sem autenticação
  - ✓ 400: Dados inválidos (DTO validation)
  - ✓ 201: Upload de imagens junto com criação

- **PUT /api/pets/:id:**
  - ✓ 200: Atualização bem-sucedida
  - ✓ 401: Sem autenticação
  - ✓ 403: Usuário não é dono do pet
  - ✓ 404: Pet não encontrado

- **DELETE /api/pets/:id:**
  - ✓ 200: Pet removido com sucesso
  - ✓ 401: Sem autenticação
  - ✓ 403: Usuário não é dono do pet
  - ✓ 404: Pet não encontrado

- **POST /api/pets/:id/images:**
  - ✓ 201: Imagens enviadas com sucesso
  - ✓ 400: Máximo de 5 imagens excedido
  - ✓ 400: Tipo de arquivo inválido
  - ✓ 413: Arquivo muito grande

#### Testes E2E - `pets.e2e-spec.ts`
- Fluxo ONG: Login → Criar pet → Upload imagens → Editar → Marcar como adotado
- Fluxo Usuário: Buscar pets → Filtrar por critérios → Ver detalhes
- Fluxo completo de adoção: Ver pet → Favoritar → Agendar visita → Marcar adotado

---

## FASE 3: FUNCIONALIDADES DE INTERAÇÃO

### 3.1 Favoritos (Favorites Module)

#### Testes Unitários - `favorites.service.spec.ts`
- **Gestão de Favoritos:**
  - ✓ Adicionar pet aos favoritos
  - ✓ Não permitir duplicatas (mesmo email + pet)
  - ✓ Remover pet dos favoritos
  - ✓ Listar favoritos de um usuário (por email)
  - ✓ Verificar se pet está nos favoritos
  - ✓ Contar total de favoritos de um pet

#### Testes de Integração - `favorites.controller.spec.ts`
- **POST /api/favorites:**
  - ✓ 201: Favorito adicionado com sucesso
  - ✓ 400: Pet já está nos favoritos
  - ✓ 404: Pet não encontrado
  - ✓ 400: Email inválido

- **GET /api/favorites?email={email}:**
  - ✓ 200: Lista de pets favoritos
  - ✓ 200: Array vazio se não há favoritos
  - ✓ 400: Email não fornecido

- **DELETE /api/favorites/:id:**
  - ✓ 200: Favorito removido com sucesso
  - ✓ 404: Favorito não encontrado

#### Testes E2E - `favorites.e2e-spec.ts`
- Fluxo completo: Ver pet → Adicionar favorito → Listar favoritos → Remover

---

### 3.2 Agendamentos (Appointments Module)

#### Testes Unitários - `appointments.service.spec.ts`
- **Criação de Agendamento:**
  - ✓ Criar agendamento com dados válidos
  - ✓ Validar horário disponível (não conflita)
  - ✓ Validar antecedência mínima
  - ✓ Validar antecedência máxima
  - ✓ Validar horário dentro do expediente
  - ✓ Validar data não é feriado/exceção
  - ✓ Enviar email de confirmação

- **Gestão de Agendamentos:**
  - ✓ Listar agendamentos da ONG
  - ✓ Filtrar por status (pending, confirmed, completed, cancelled)
  - ✓ Filtrar por data
  - ✓ Filtrar por pet
  - ✓ Atualizar status do agendamento
  - ✓ Cancelar agendamento
  - ✓ Reagendar visita

- **Notificações:**
  - ✓ Enviar email ao criar agendamento
  - ✓ Enviar email ao confirmar agendamento
  - ✓ Enviar email ao cancelar agendamento
  - ✓ Enviar lembrete 24h antes da visita

#### Testes de Integração - `appointments.controller.spec.ts`
- **POST /api/appointments:**
  - ✓ 201: Agendamento criado com sucesso
  - ✓ 400: Dados inválidos
  - ✓ 409: Horário não disponível
  - ✓ 404: Pet não encontrado
  - ✓ 400: Data no passado
  - ✓ 400: Fora do horário de funcionamento

- **GET /api/appointments/ong:**
  - ✓ 200: Lista de agendamentos da ONG
  - ✓ 401: Sem autenticação
  - ✓ 200: Filtros funcionam corretamente

- **PUT /api/appointments/:id/status:**
  - ✓ 200: Status atualizado com sucesso
  - ✓ 401: Sem autenticação
  - ✓ 403: Usuário não é dono da ONG
  - ✓ 400: Transição de status inválida

#### Testes E2E - `appointments.e2e-spec.ts`
- Fluxo completo: Ver pet → Verificar slots → Agendar → ONG confirma → Visita realizada
- Fluxo de cancelamento: Agendar → Cancelar pelo visitante
- Fluxo de cancelamento: Agendar → ONG cancela e notifica

---

## FASE 4: MONETIZAÇÃO E CONTEÚDO

### 4.1 Doações (Donations Module)

#### Testes Unitários - `donations.service.spec.ts`
- **Processamento de Doação:**
  - ✓ Criar doação one-time com Stripe
  - ✓ Criar doação recorrente (mensal)
  - ✓ Validar valor mínimo (€5)
  - ✓ Gerar referência MBWay
  - ✓ Processar callback do MBWay
  - ✓ Atualizar status da doação (pending → completed)
  - ✓ Gerar recibo em PDF
  - ✓ Enviar email com recibo

- **Gestão de Doações:**
  - ✓ Listar doações da ONG
  - ✓ Filtrar por período (data início/fim)
  - ✓ Filtrar por tipo (one_time, monthly)
  - ✓ Filtrar por status (pending, completed, failed)
  - ✓ Calcular total arrecadado
  - ✓ Estatísticas de doações (média, total, count)

- **Webhooks:**
  - ✓ Processar webhook Stripe (payment succeeded)
  - ✓ Processar webhook Stripe (payment failed)
  - ✓ Validar assinatura do webhook
  - ✓ Processar callback MBWay

#### Testes de Integração - `donations.controller.spec.ts`
- **POST /api/donations:**
  - ✓ 201: Doação criada com sucesso (Stripe)
  - ✓ 201: Referência MBWay gerada
  - ✓ 400: Valor abaixo do mínimo
  - ✓ 400: Dados do doador inválidos
  - ✓ 404: ONG não encontrada
  - ✓ 500: Erro no processamento Stripe

- **GET /api/donations/ong/:ongId:**
  - ✓ 200: Lista de doações da ONG
  - ✓ 401: Sem autenticação
  - ✓ 403: Usuário não é dono da ONG
  - ✓ 200: Estatísticas calculadas corretamente

- **POST /api/donations/webhook/stripe:**
  - ✓ 200: Webhook processado com sucesso
  - ✓ 400: Assinatura inválida
  - ✓ 200: Status da doação atualizado

#### Testes de Integração - `mbway.service.spec.ts`
- **MBWay Integration:**
  - ✓ Gerar referência MBWay válida
  - ✓ Validar número de telefone português
  - ✓ Consultar status de pagamento
  - ✓ Processar callback de confirmação

#### Testes E2E - `donations.e2e-spec.ts`
- Fluxo Stripe: Selecionar ONG → Escolher valor → Pagar → Receber recibo
- Fluxo MBWay: Selecionar ONG → Gerar referência → Simular callback → Confirmação
- Fluxo recorrente: Criar doação mensal → Webhook renova → Email enviado

---

### 4.2 Artigos (Articles Module)

#### Testes Unitários - `articles.service.spec.ts`
- **Gestão de Artigos:**
  - ✓ Criar artigo (apenas admin/ONG)
  - ✓ Atualizar artigo
  - ✓ Remover artigo (soft delete)
  - ✓ Publicar/despublicar artigo
  - ✓ Upload de imagem de capa
  - ✓ Validar campos obrigatórios (título, conteúdo)

- **Listagem:**
  - ✓ Listar artigos publicados (público)
  - ✓ Filtrar por categoria
  - ✓ Filtrar por autor (ONG)
  - ✓ Busca por texto (título, conteúdo)
  - ✓ Ordenar por data (mais recentes)
  - ✓ Paginação

#### Testes de Integração - `articles.controller.spec.ts`
- **GET /api/articles:**
  - ✓ 200: Lista de artigos publicados
  - ✓ 200: Filtros funcionam corretamente
  - ✓ 200: Paginação funciona

- **GET /api/articles/:id:**
  - ✓ 200: Detalhes completos do artigo
  - ✓ 404: Artigo não encontrado
  - ✓ 403: Artigo não publicado (não visível para público)

- **POST /api/articles:**
  - ✓ 201: Artigo criado com sucesso
  - ✓ 401: Sem autenticação
  - ✓ 403: Usuário sem permissão
  - ✓ 400: Dados inválidos

- **PUT /api/articles/:id:**
  - ✓ 200: Artigo atualizado
  - ✓ 401: Sem autenticação
  - ✓ 403: Usuário não é autor

- **DELETE /api/articles/:id:**
  - ✓ 200: Artigo removido
  - ✓ 401: Sem autenticação
  - ✓ 403: Usuário não é autor

#### Testes E2E - `articles.e2e-spec.ts`
- Fluxo ONG: Criar artigo → Upload imagem → Publicar
- Fluxo público: Listar artigos → Ler artigo completo

---

## FASE 5: ADMINISTRAÇÃO E ANALYTICS

### 5.1 Admin (Admin Module)

#### Testes Unitários - `admin.service.spec.ts`
- **Gestão de Usuários:**
  - ✓ Listar todos os usuários
  - ✓ Bloquear/desbloquear usuário
  - ✓ Remover usuário (soft delete)
  - ✓ Alterar role de usuário

- **Moderação de Conteúdo:**
  - ✓ Listar pets pendentes de aprovação
  - ✓ Aprovar pet
  - ✓ Rejeitar pet (com motivo)
  - ✓ Listar artigos pendentes
  - ✓ Aprovar/rejeitar artigo

- **Estatísticas Gerais:**
  - ✓ Total de usuários (ONGs)
  - ✓ Total de pets (por status)
  - ✓ Total de agendamentos
  - ✓ Total de doações arrecadadas
  - ✓ Crescimento mensal (novos usuários, pets)

#### Testes de Integração - `admin.controller.spec.ts`
- **GET /api/admin/users:**
  - ✓ 200: Lista de todos os usuários
  - ✓ 401: Sem autenticação
  - ✓ 403: Usuário não é admin

- **PUT /api/admin/users/:id/block:**
  - ✓ 200: Usuário bloqueado
  - ✓ 403: Sem permissão admin

- **GET /api/admin/statistics:**
  - ✓ 200: Estatísticas completas do sistema
  - ✓ 403: Sem permissão admin

#### Testes E2E - `admin.e2e-spec.ts`
- Fluxo de moderação: Ver pet pendente → Aprovar → Notificar ONG
- Fluxo de gestão: Ver usuário problemático → Bloquear → Enviar notificação

---

### 5.2 Analytics (Analytics Module)

#### Testes Unitários - `analytics.service.spec.ts`
- **Métricas de Pets:**
  - ✓ Taxa de adoção (adopted / total)
  - ✓ Tempo médio até adoção
  - ✓ Pets mais visualizados
  - ✓ Pets mais favoritados
  - ✓ Distribuição por espécie

- **Métricas de ONG:**
  - ✓ Total de pets cadastrados
  - ✓ Total de adoções realizadas
  - ✓ Total de doações recebidas
  - ✓ Taxa de confirmação de agendamentos
  - ✓ Avaliação média (se houver)

- **Métricas de Plataforma:**
  - ✓ Usuários ativos (DAU, MAU)
  - ✓ Novos cadastros (ONGs)
  - ✓ Taxa de conversão (view → appointment)
  - ✓ Receita total de doações
  - ✓ Valor médio de doação

#### Testes de Integração - `analytics.controller.spec.ts`
- **GET /api/analytics/ong/:id:**
  - ✓ 200: Métricas da ONG
  - ✓ 401: Sem autenticação
  - ✓ 403: Usuário não é dono da ONG

- **GET /api/analytics/platform:**
  - ✓ 200: Métricas da plataforma
  - ✓ 403: Apenas admin

#### Testes E2E - `analytics.e2e-spec.ts`
- Dashboard ONG: Login → Ver estatísticas completas
- Dashboard Admin: Ver métricas gerais da plataforma

---

## TESTES ADICIONAIS

### Performance Tests
- **Carga:**
  - ✓ 100 requisições simultâneas em /api/pets
  - ✓ 50 uploads simultâneos de imagens
  - ✓ Tempo de resposta < 200ms (p95)

- **Database:**
  - ✓ Queries otimizadas com índices
  - ✓ N+1 queries eliminadas
  - ✓ Connection pooling configurado

### Security Tests
- **Autenticação:**
  - ✓ JWT expirado rejeitado
  - ✓ JWT com assinatura inválida rejeitado
  - ✓ Rate limiting em endpoints de auth
  - ✓ Proteção contra brute force

- **Autorização:**
  - ✓ Usuário não pode editar pets de outra ONG
  - ✓ Usuário não pode ver doações de outra ONG
  - ✓ Apenas admin acessa rotas administrativas

- **Input Validation:**
  - ✓ SQL Injection prevenido
  - ✓ XSS prevenido (sanitização)
  - ✓ CSRF tokens configurados
  - ✓ File upload vulnerabilities prevenidas

### Accessibility Tests (Frontend)
- ✓ Navegação por teclado funciona
- ✓ Leitores de tela compatíveis
- ✓ Contraste de cores (WCAG AA)
- ✓ Formulários têm labels apropriados
- ✓ ARIA attributes corretos

### PWA Tests
- **Offline:**
  - ✓ Service worker registrado
  - ✓ Cache de assets estáticos
  - ✓ Fallback pages funcionam offline
  - ✓ Sincronização quando volta online

- **Install:**
  - ✓ Manifest.json válido
  - ✓ Ícones em múltiplos tamanhos
  - ✓ Install prompt funciona
  - ✓ Splash screen configurada

- **Lighthouse:**
  - ✓ PWA score > 90
  - ✓ Performance score > 80
  - ✓ Accessibility score > 90
  - ✓ Best Practices score > 90

---

## SETUP DE TESTES

### Ferramentas Necessárias

**Backend (NestJS):**
```json
{
  "jest": "^29.0.0",
  "@nestjs/testing": "^10.0.0",
  "supertest": "^6.3.0",
  "@types/supertest": "^6.0.0",
  "faker-js/faker": "^8.0.0"
}
```

**Frontend (Angular):**
```json
{
  "jasmine-core": "^5.0.0",
  "karma": "^6.4.0",
  "karma-jasmine": "^5.1.0",
  "karma-chrome-launcher": "^3.2.0",
  "@angular/cdk/testing": "^17.0.0"
}
```

**E2E:**
```json
{
  "cypress": "^13.0.0",
  "@cypress/schematic": "^2.5.0"
}
```

### Configuração de Ambiente de Testes

**Database Test:**
- PostgreSQL em Docker
- Database limpo antes de cada suite
- Seed data consistente
- Transações com rollback

**Mocks:**
- Email service (não enviar emails reais)
- Payment services (Stripe test mode)
- File storage (mock S3/Cloudinary)
- External APIs (geocoding, etc)

---

## MÉTRICAS DE SUCESSO

### Cobertura de Código
- **Target:** 80% overall
- **Crítico (100%):** Auth, Payments, User data
- **Alto (90%):** Pets, Appointments, Donations
- **Médio (80%):** Articles, Favorites
- **Baixo (70%):** Analytics, Admin

### Tempo de Execução
- Unit tests: < 30 segundos
- Integration tests: < 2 minutos
- E2E tests: < 10 minutos
- Total CI/CD: < 15 minutos

### Quality Gates
- Zero critical bugs em produção
- Zero vulnerabilidades de segurança (Snyk)
- Lighthouse PWA score > 90
- Todos os testes passando antes de merge

---

## CRONOGRAMA SUGERIDO

**Semana 1-2:** Fase 1 (Auth + Users) - 40 horas
**Semana 3-4:** Fase 2 (ONGs + Pets) - 60 horas
**Semana 5-6:** Fase 3 (Favorites + Appointments) - 40 horas
**Semana 7-8:** Fase 4 (Donations + Articles) - 40 horas
**Semana 9-10:** Fase 5 (Admin + Analytics) - 30 horas
**Semana 11:** Performance + Security tests - 20 horas
**Semana 12:** PWA + Accessibility tests - 20 horas

**Total:** ~250 horas de desenvolvimento de testes

---

## COMANDOS ÚTEIS

```bash
# Rodar todos os testes
npm test

# Rodar testes com coverage
npm run test:cov

# Rodar testes de integração
npm run test:integration

# Rodar testes E2E
npm run test:e2e

# Rodar testes em watch mode
npm run test:watch

# Rodar Cypress interativo
npm run cypress:open

# Rodar testes de performance
npm run test:perf

# Gerar relatório de coverage
npm run test:cov:report
```

---

**Versão:** 1.0
**Data:** 07/01/2025
**Próxima Revisão:** Após conclusão da Fase 1
