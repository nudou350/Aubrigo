# 📋 Sistema de Agendamento Inteligente - TODO

## ✅ FASE 1 MVP - COMPLETO (Backend)

### Database & Entities
- [x] Entity `OngOperatingHours` - Horários de funcionamento por dia da semana
- [x] Entity `AppointmentSettings` - Configurações de agendamento (duração, slots, etc)
- [x] Entity `OngAvailabilityException` - Bloqueios e exceções (férias, feriados)
- [x] Atualizar entity `Appointment` com campos `scheduledStartTime`, `scheduledEndTime`, `timezone`
- [x] Migration automática criada e executada

### Services
- [x] `OperatingHoursService` - CRUD horários de funcionamento
- [x] `AppointmentSettingsService` - CRUD configurações
- [x] `AvailableSlotsService` - **Cálculo inteligente de slots disponíveis**
- [x] `AvailabilityExceptionsService` - Gerenciamento de bloqueios
- [x] Atualizar `AppointmentsService` com validações automáticas

### Controllers & Endpoints
- [x] `OperatingHoursController` - 15+ endpoints criados
- [x] Endpoints de configuração de horários
- [x] Endpoints de configuração de settings
- [x] Endpoints de slots disponíveis (público)
- [x] Endpoints de datas disponíveis (público)
- [x] Endpoints de exceções/bloqueios

### DTOs
- [x] `CreateOperatingHoursDto` + `UpdateOperatingHoursDto` + `BulkOperatingHoursDto`
- [x] `CreateAppointmentSettingsDto` + `UpdateAppointmentSettingsDto`
- [x] `CreateAvailabilityExceptionDto`
- [x] `AvailableSlotDto` + `AvailableSlotsResponseDto` + `AvailableDatesResponseDto`
- [x] Atualizar `CreateAppointmentDto` com campo `scheduledStartTime` (opcional)

---

## ✅ FASE 2 MELHORIAS - COMPLETO (Backend)

### Email Notifications
- [x] `sendAppointmentAutoConfirmedToVisitor` - Email de confirmação automática
- [x] `sendAppointmentAutoConfirmedToOng` - Notificação para ONG
- [x] `sendAppointmentCancellationToVisitor` - Email de cancelamento
- [x] `sendAppointmentCancellationToOng` - Notificação de cancelamento para ONG

### Funcionalidades Avançadas
- [x] Sistema de cancelamento de agendamentos
- [x] Auto-criação de feriados portugueses
- [x] Cleanup de exceções expiradas
- [x] Validação de overlapping de exceções
- [x] Backward compatibility com sistema legado

### Integração
- [x] Integrar EmailModule no AppointmentsModule
- [x] Integrar notificações no fluxo de criação de appointments
- [x] Endpoint `PATCH /api/appointments/:id/cancel`

---

## 🔌 ENDPOINTS CRIADOS

### Horários de Funcionamento
```
GET    /api/ongs/my-ong/operating-hours              (Auth: ONG)
POST   /api/ongs/my-ong/operating-hours              (Auth: ONG)
POST   /api/ongs/my-ong/operating-hours/bulk         (Auth: ONG)
PUT    /api/ongs/my-ong/operating-hours/:dayOfWeek   (Auth: ONG)
DELETE /api/ongs/my-ong/operating-hours/:dayOfWeek   (Auth: ONG)
GET    /api/ongs/:ongId/operating-hours              (Public)
```

### Configurações de Agendamento
```
GET    /api/ongs/my-ong/appointment-settings         (Auth: ONG)
POST   /api/ongs/my-ong/appointment-settings         (Auth: ONG)
PUT    /api/ongs/my-ong/appointment-settings         (Auth: ONG)
GET    /api/ongs/:ongId/appointment-settings         (Public)
```

### Slots & Datas Disponíveis (USUÁRIOS)
```
GET    /api/ongs/:ongId/available-slots?date=2025-01-10
GET    /api/ongs/:ongId/available-dates?year=2025&month=1
```

### Exceções/Bloqueios
```
GET    /api/ongs/my-ong/exceptions                   (Auth: ONG)
GET    /api/ongs/my-ong/exceptions/active            (Auth: ONG)
POST   /api/ongs/my-ong/exceptions                   (Auth: ONG)
POST   /api/ongs/my-ong/exceptions/holidays/:year    (Auth: ONG)
PUT    /api/ongs/my-ong/exceptions/:id               (Auth: ONG)
DELETE /api/ongs/my-ong/exceptions/:id               (Auth: ONG)
DELETE /api/ongs/my-ong/exceptions/cleanup/expired   (Auth: ONG)
GET    /api/ongs/:ongId/exceptions                   (Public)
```

### Agendamentos (ATUALIZADO)
```
POST   /api/appointments                              (Public)
       Body: {
         petId, visitorName, visitorEmail, visitorPhone,
         scheduledStartTime: "2025-01-10T10:00:00Z"  // NOVO! (opcional)
       }

PATCH  /api/appointments/:id/cancel                  (Public)
       Body: { reason?: "motivo opcional" }
```

---

## ✅ COMPLETO - FRONTEND

### 1. Componente de Configuração de Horários (ONG)
**Arquivo**: `frontend/src/app/features/ong/scheduling-settings/`
- [x] Criar componente `SchedulingSettingsComponent`
- [x] Formulário de horários de funcionamento (Segunda a Domingo)
- [x] Toggle para abrir/fechar cada dia
- [x] Inputs para horário de abertura/fechamento
- [x] Inputs para horário de almoço (opcional)
- [x] Configurações de agendamento (duração, visitas simultâneas, antecedência, etc.)
- [x] Botão "Salvar Configurações" (salva horários e settings em paralelo)
- [x] Rota: `/ong/scheduling-settings`

### 2. Componente de Gestão de Bloqueios (ONG)
**Arquivo**: `frontend/src/app/features/ong/availability-exceptions/`
- [x] Listar exceções ativas
- [x] Botão "Adicionar Bloqueio"
- [x] Modal com date range picker
- [x] Input para motivo
- [x] Botão "Auto-criar Feriados 2025"
- [x] Botão "Limpar Expirados"
- [x] Editar/Deletar exceções
- [x] Rota: `/ong/availability-exceptions`

### 3. Calendário de Agendamento (USUÁRIO)
**Arquivo**: `frontend/src/app/features/pets/schedule-appointment/`
- [x] Calendário customizado com grid de 7x5
- [x] Navegação entre meses
- [x] Chamar `GET /api/ongs/:ongId/available-dates?year&month`
- [x] Marcar em verde apenas dias disponíveis
- [x] Desabilitar dias sem disponibilidade
- [x] Sistema de passos (3 steps: Data → Horário → Dados)

### 4. Seleção de Horários (USUÁRIO)
**Arquivo**: `frontend/src/app/features/pets/schedule-appointment/`
- [x] Chamar `GET /api/ongs/:ongId/available-slots?date=...`
- [x] Mostrar slots em grade (botões clicáveis)
- [x] Desabilitar slots não disponíveis
- [x] Mostrar horários formatados em pt-PT
- [x] Ao selecionar, avançar para step 3

### 5. Confirmação de Agendamento
- [x] Mostrar resumo antes de confirmar
- [x] Exibir data, horário no formato completo
- [x] Formulário com dados do visitante
- [x] Botão "Confirmar Agendamento"
- [x] Tela de sucesso: "Visita confirmada automaticamente!"
- [x] Integração com novo sistema (scheduledStartTime)

### 6. Services Criados
- [x] `scheduling.service.ts` - Todos os endpoints do novo sistema
- [x] Atualizar `appointments.service.ts` - scheduledStartTime e cancel
- [x] Backward compatibility mantida (preferredDate/Time)

### 7. Melhorias Gerais
- [x] Atualizado componente de appointments da ONG para suportar ambos sistemas
- [x] Rotas adicionadas no app.routes.ts
- [x] Frontend compilando sem erros
- [x] Backend rodando corretamente

---

## 🎯 FASE 3 - FUTURO (Opcional)

### Analytics & Relatórios
- [ ] Dashboard de ocupação de horários
- [ ] Gráfico de agendamentos por dia/semana/mês
- [ ] Taxa de cancelamento
- [ ] Horários mais populares

### Reagendamento Automático
- [ ] Se ONG bloquear uma data com agendamentos confirmados
- [ ] Oferecer slots alternativos aos usuários
- [ ] Enviar email com opções de reagendamento

### Notificações Push
- [ ] Lembrete 24h antes da visita
- [ ] Lembrete 1h antes da visita
- [ ] Notificação de cancelamento em tempo real

### Lista de Espera
- [ ] Se todos os slots estiverem ocupados
- [ ] Usuário pode entrar em lista de espera
- [ ] Notificar se houver cancelamento

---

## 📁 ARQUIVOS CRIADOS (Referência)

### Backend
```
backend/src/ongs/
├── entities/
│   ├── ong-operating-hours.entity.ts
│   ├── appointment-settings.entity.ts
│   └── ong-availability-exception.entity.ts
├── services/
│   ├── operating-hours.service.ts
│   ├── appointment-settings.service.ts
│   ├── available-slots.service.ts
│   └── availability-exceptions.service.ts
├── controllers/
│   └── operating-hours.controller.ts
├── dto/
│   ├── create-operating-hours.dto.ts
│   ├── update-operating-hours.dto.ts
│   ├── bulk-operating-hours.dto.ts
│   ├── create-appointment-settings.dto.ts
│   ├── update-appointment-settings.dto.ts
│   ├── create-availability-exception.dto.ts
│   └── available-slot.dto.ts
└── ongs.module.ts

backend/src/appointments/
├── entities/appointment.entity.ts (ATUALIZADO)
├── dto/create-appointment.dto.ts (ATUALIZADO)
├── appointments.service.ts (ATUALIZADO)
├── appointments.controller.ts (ATUALIZADO)
└── appointments.module.ts (ATUALIZADO)

backend/src/email/
└── email.service.ts (ATUALIZADO - 4 novos métodos)

backend/src/database/migrations/
└── 1736100000000-AddAppointmentSchedulingSystem.ts
```

---

## 🚀 COMO TESTAR (Backend já funcional)

### 1. Configurar Horários de Funcionamento
```bash
POST /api/ongs/my-ong/operating-hours/bulk
{
  "operatingHours": [
    { "dayOfWeek": 1, "isOpen": true, "openTime": "09:00", "closeTime": "17:00", "lunchBreakStart": "12:00", "lunchBreakEnd": "13:00" },
    { "dayOfWeek": 2, "isOpen": true, "openTime": "09:00", "closeTime": "17:00", "lunchBreakStart": "12:00", "lunchBreakEnd": "13:00" },
    // ... outros dias
  ]
}
```

### 2. Configurar Settings
```bash
POST /api/ongs/my-ong/appointment-settings
{
  "visitDurationMinutes": 60,
  "maxConcurrentVisits": 2,
  "minAdvanceBookingHours": 24,
  "maxAdvanceBookingDays": 30,
  "slotIntervalMinutes": 30
}
```

### 3. Criar Feriados Automaticamente
```bash
POST /api/ongs/my-ong/exceptions/holidays/2025
```

### 4. Ver Datas Disponíveis
```bash
GET /api/ongs/{ongId}/available-dates?year=2025&month=1
```

### 5. Ver Slots de um Dia
```bash
GET /api/ongs/{ongId}/available-slots?date=2025-01-15
```

### 6. Criar Agendamento (Novo Sistema)
```bash
POST /api/appointments
{
  "petId": "uuid-do-pet",
  "visitorName": "João Silva",
  "visitorEmail": "joao@example.com",
  "visitorPhone": "+351912345678",
  "scheduledStartTime": "2025-01-15T10:00:00Z",
  "notes": "Primeira visita"
}
```

---

## 📝 NOTAS IMPORTANTES

1. **Backend está 100% funcional** - Todas as tabelas criadas, endpoints funcionando
2. **Emails precisam de configuração** - Adicionar credenciais SMTP no `.env`
3. **Sistema é backward compatible** - Aceita agendamentos com e sem `scheduledStartTime`
4. **Falta apenas o FRONTEND** - Toda a lógica de negócio já está implementada
5. **Timezone padrão: Europe/Lisbon** - Configurado automaticamente

---

## 🎯 PRIORIDADE PARA CONTINUAR

1. **ALTA**: Criar componente de calendário com slots (usuário)
2. **ALTA**: Criar painel de configuração de horários (ONG)
3. **MÉDIA**: Criar gestão de bloqueios (ONG)
4. **BAIXA**: Analytics e relatórios

---

**Última atualização**: 5 de Janeiro de 2025
**Status**: Backend completo (Fase 1 + Fase 2) | Frontend pendente
