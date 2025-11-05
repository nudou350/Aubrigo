# 📅 API de Agendamento Inteligente - Documentação

## 🎯 Visão Geral

Sistema completo de agendamento para ONGs com:
- ✅ Horários de funcionamento configuráveis
- ✅ Validação automática de disponibilidade
- ✅ Bloqueios e exceções (férias, feriados)
- ✅ Confirmação automática de agendamentos
- ✅ Notificações por email
- ✅ Proteção contra overbooking

---

## 🔐 Autenticação

Endpoints marcados com `(Auth: ONG)` requerem:
```
Headers:
  Authorization: Bearer {JWT_TOKEN}
```

---

## 📋 HORÁRIOS DE FUNCIONAMENTO

### 1. Listar Horários da Minha ONG
```http
GET /api/ongs/my-ong/operating-hours
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "dayOfWeek": 1,
    "isOpen": true,
    "openTime": "09:00",
    "closeTime": "17:00",
    "lunchBreakStart": "12:00",
    "lunchBreakEnd": "13:00"
  }
]
```

### 2. Configurar Todos os Horários (Bulk)
```http
POST /api/ongs/my-ong/operating-hours/bulk
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "operatingHours": [
    {
      "dayOfWeek": 0,
      "isOpen": false,
      "openTime": "00:00",
      "closeTime": "00:00"
    },
    {
      "dayOfWeek": 1,
      "isOpen": true,
      "openTime": "09:00",
      "closeTime": "17:00",
      "lunchBreakStart": "12:00",
      "lunchBreakEnd": "13:00"
    },
    {
      "dayOfWeek": 2,
      "isOpen": true,
      "openTime": "09:00",
      "closeTime": "17:00"
    }
  ]
}
```

**Notas:**
- `dayOfWeek`: 0=Domingo, 1=Segunda, ..., 6=Sábado
- Se `isOpen: false`, os horários são ignorados
- `lunchBreakStart` e `lunchBreakEnd` são opcionais

### 3. Atualizar Horário de Um Dia
```http
PUT /api/ongs/my-ong/operating-hours/:dayOfWeek
Authorization: Bearer {token}
```

**Body:**
```json
{
  "isOpen": true,
  "openTime": "10:00",
  "closeTime": "18:00"
}
```

### 4. Ver Horários de Qualquer ONG (Público)
```http
GET /api/ongs/:ongId/operating-hours
```

---

## ⚙️ CONFIGURAÇÕES DE AGENDAMENTO

### 1. Ver Minhas Configurações
```http
GET /api/ongs/my-ong/appointment-settings
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "uuid",
  "visitDurationMinutes": 60,
  "maxConcurrentVisits": 2,
  "minAdvanceBookingHours": 24,
  "maxAdvanceBookingDays": 30,
  "slotIntervalMinutes": 30,
  "allowWeekendBookings": true
}
```

### 2. Configurar/Atualizar Settings
```http
POST /api/ongs/my-ong/appointment-settings
Authorization: Bearer {token}
```

**Body:**
```json
{
  "visitDurationMinutes": 60,
  "maxConcurrentVisits": 2,
  "minAdvanceBookingHours": 24,
  "maxAdvanceBookingDays": 30,
  "slotIntervalMinutes": 30,
  "allowWeekendBookings": true
}
```

**Campos:**
- `visitDurationMinutes`: Duração de cada visita (min: 15)
- `maxConcurrentVisits`: Quantas visitas ao mesmo tempo (min: 1)
- `minAdvanceBookingHours`: Antecedência mínima para agendar (min: 0)
- `maxAdvanceBookingDays`: Máximo de dias no futuro (min: 1)
- `slotIntervalMinutes`: Intervalo entre slots (ex: 30min)
- `allowWeekendBookings`: Permitir agendamentos em fins de semana

---

## 🚫 BLOQUEIOS E EXCEÇÕES

### 1. Listar Todas as Exceções
```http
GET /api/ongs/my-ong/exceptions
Authorization: Bearer {token}
```

### 2. Listar Apenas Exceções Ativas
```http
GET /api/ongs/my-ong/exceptions/active
Authorization: Bearer {token}
```

### 3. Criar Bloqueio
```http
POST /api/ongs/my-ong/exceptions
Authorization: Bearer {token}
```

**Body:**
```json
{
  "exceptionType": "blocked",
  "startDate": "2025-12-24",
  "endDate": "2025-12-26",
  "startTime": null,
  "endTime": null,
  "reason": "Férias de Natal"
}
```

**Campos:**
- `exceptionType`: "blocked" (bloquear) ou "available" (disponibilizar)
- `startDate` / `endDate`: Formato YYYY-MM-DD
- `startTime` / `endTime`: Opcional, formato HH:mm (para bloquear apenas parte do dia)
- `reason`: Motivo do bloqueio

### 4. Auto-Criar Feriados Portugueses
```http
POST /api/ongs/my-ong/exceptions/holidays/2025
Authorization: Bearer {token}
```

**Feriados criados automaticamente:**
- 01/01 - Ano Novo
- 25/04 - Dia da Liberdade
- 01/05 - Dia do Trabalhador
- 10/06 - Dia de Portugal
- 15/08 - Assunção de Nossa Senhora
- 05/10 - Implantação da República
- 01/11 - Todos os Santos
- 01/12 - Restauração da Independência
- 08/12 - Imaculada Conceição
- 25/12 - Natal

### 5. Atualizar Exceção
```http
PUT /api/ongs/my-ong/exceptions/:id
Authorization: Bearer {token}
```

### 6. Deletar Exceção
```http
DELETE /api/ongs/my-ong/exceptions/:id
Authorization: Bearer {token}
```

### 7. Limpar Exceções Expiradas
```http
DELETE /api/ongs/my-ong/exceptions/cleanup/expired
Authorization: Bearer {token}
```

---

## 📅 DISPONIBILIDADE (Público)

### 1. Ver Datas Disponíveis em um Mês
```http
GET /api/ongs/:ongId/available-dates?year=2025&month=1
```

**Response:**
```json
{
  "year": 2025,
  "month": 1,
  "availableDates": [
    "2025-01-02",
    "2025-01-03",
    "2025-01-06",
    "2025-01-07",
    "2025-01-08"
  ]
}
```

**Uso no Frontend:**
Marcar em verde no calendário apenas as datas retornadas.

### 2. Ver Slots Disponíveis em uma Data
```http
GET /api/ongs/:ongId/available-slots?date=2025-01-10
```

**Response:**
```json
{
  "date": "2025-01-10",
  "ongOperatingHours": {
    "isOpen": true,
    "openTime": "09:00",
    "closeTime": "17:00",
    "lunchBreakStart": "12:00",
    "lunchBreakEnd": "13:00"
  },
  "slots": [
    {
      "startTime": "2025-01-10T09:00:00.000Z",
      "endTime": "2025-01-10T10:00:00.000Z",
      "available": true
    },
    {
      "startTime": "2025-01-10T09:30:00.000Z",
      "endTime": "2025-01-10T10:30:00.000Z",
      "available": true
    },
    {
      "startTime": "2025-01-10T10:00:00.000Z",
      "endTime": "2025-01-10T11:00:00.000Z",
      "available": false,
      "reason": "Fully booked"
    }
  ]
}
```

**Uso no Frontend:**
- Mostrar apenas slots com `available: true` como clicáveis
- Desabilitar slots com `available: false`
- Não mostrar slots durante o almoço

---

## 📆 AGENDAMENTOS

### 1. Criar Agendamento (Novo Sistema)
```http
POST /api/appointments
Content-Type: application/json
```

**Body:**
```json
{
  "petId": "uuid-do-pet",
  "visitorName": "João Silva",
  "visitorEmail": "joao@example.com",
  "visitorPhone": "+351912345678",
  "scheduledStartTime": "2025-01-10T10:00:00Z",
  "notes": "Primeira visita"
}
```

**Validações Automáticas:**
- ✅ Verifica se o slot está disponível
- ✅ Verifica capacidade máxima
- ✅ Verifica horário de funcionamento
- ✅ Verifica bloqueios/exceções
- ✅ Verifica antecedência mínima

**Response (Sucesso):**
```json
{
  "id": "uuid",
  "petId": "uuid",
  "visitorName": "João Silva",
  "visitorEmail": "joao@example.com",
  "scheduledStartTime": "2025-01-10T10:00:00Z",
  "scheduledEndTime": "2025-01-10T11:00:00Z",
  "status": "confirmed",
  "createdAt": "2025-01-05T14:30:00Z"
}
```

**Emails Enviados Automaticamente:**
- ✅ Email de confirmação para o visitante (com data, hora, local, contato)
- ✅ Email de notificação para a ONG (com dados do visitante)

### 2. Criar Agendamento (Sistema Legado - Backward Compatible)
```http
POST /api/appointments
```

**Body (sem scheduledStartTime):**
```json
{
  "petId": "uuid",
  "visitorName": "João Silva",
  "visitorEmail": "joao@example.com",
  "preferredDate": "2025-01-10",
  "preferredTime": "10:00",
  "notes": "Gostaria de visitar"
}
```

**Response:**
- Status: "pending" (precisa aprovação da ONG)
- Emails diferentes (sem confirmação automática)

### 3. Cancelar Agendamento
```http
PATCH /api/appointments/:id/cancel
Content-Type: application/json
```

**Body (opcional):**
```json
{
  "reason": "Não poderei comparecer"
}
```

**Emails Enviados Automaticamente:**
- ✅ Email de cancelamento para visitante
- ✅ Email de cancelamento para ONG

---

## 🎨 EXEMPLOS DE USO NO FRONTEND

### Fluxo Completo de Agendamento (Usuário)

```typescript
// 1. Buscar datas disponíveis do mês
const datesResponse = await http.get(
  `/api/ongs/${ongId}/available-dates?year=2025&month=1`
);
// Marcar em verde: datesResponse.availableDates

// 2. Quando usuário seleciona uma data
const slotsResponse = await http.get(
  `/api/ongs/${ongId}/available-slots?date=2025-01-10`
);

// 3. Filtrar apenas slots disponíveis
const availableSlots = slotsResponse.slots.filter(s => s.available);

// 4. Mostrar slots como botões
// Quando usuário clica em um slot:
const selectedSlot = '2025-01-10T10:00:00Z';

// 5. Criar agendamento
const appointment = await http.post('/api/appointments', {
  petId: currentPet.id,
  visitorName: form.name,
  visitorEmail: form.email,
  visitorPhone: form.phone,
  scheduledStartTime: selectedSlot,
  notes: form.notes
});

// 6. Mostrar confirmação
alert('Visita confirmada automaticamente!');
```

### Configurar Horários (ONG)

```typescript
// 1. Criar objeto com 7 dias da semana
const operatingHours = [
  { dayOfWeek: 0, isOpen: false }, // Domingo fechado
  {
    dayOfWeek: 1,
    isOpen: true,
    openTime: '09:00',
    closeTime: '17:00',
    lunchBreakStart: '12:00',
    lunchBreakEnd: '13:00'
  },
  // ... outros dias
];

// 2. Salvar tudo de uma vez
await http.post('/api/ongs/my-ong/operating-hours/bulk', {
  operatingHours
});
```

---

## 🔴 Códigos de Erro

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "The requested time slot is not available. Reason: Fully booked"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Pet not found"
}
```

---

## 📝 Notas de Implementação

1. **Timezone**: Todos os horários são em `Europe/Lisbon`
2. **Formato de Hora**: Sempre `HH:mm` (ex: "09:00", "17:30")
3. **Formato de Data**: `YYYY-MM-DD` para datas, ISO 8601 para datetime
4. **Status de Appointment**:
   - `pending`: Aguardando aprovação (sistema legado)
   - `confirmed`: Confirmado automaticamente
   - `cancelled`: Cancelado
   - `completed`: Visita realizada

5. **Backward Compatibility**: O sistema aceita ambos os formatos:
   - Novo: `scheduledStartTime` → status "confirmed"
   - Legado: `preferredDate` + `preferredTime` → status "pending"

---

**Versão**: 1.0
**Data**: 5 de Janeiro de 2025
**Status**: Produção
