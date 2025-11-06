# Background Sync - Guia de Uso

Este documento explica como usar o sistema de Background Sync para gerenciar ações offline.

## Visão Geral

O sistema de Background Sync permite que o usuário execute ações mesmo quando está offline. As ações são armazenadas em uma fila no IndexedDB e são sincronizadas automaticamente quando a conexão volta.

## Componentes

### 1. OfflineQueueService
Gerencia a fila de ações offline usando IndexedDB.

### 2. NetworkStatusService
Monitora o status da conexão de rede.

### 3. OfflineSyncBadgeComponent
Mostra um badge visual com ações pendentes.

## Como Usar em Serviços

### Exemplo: Serviço de Agendamento

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OfflineQueueService, OfflineActionType } from './offline-queue.service';
import { NetworkStatusService } from './network-status.service';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private http = inject(HttpClient);
  private offlineQueue = inject(OfflineQueueService);
  private networkStatus = inject(NetworkStatusService);

  private readonly API_URL = '/api/appointments';

  /**
   * Criar agendamento - funciona online e offline
   */
  async createAppointment(data: any): Promise<any> {
    // Se estiver online, envia direto
    if (this.networkStatus.isOnline()) {
      try {
        const result = await this.http.post(this.API_URL, data).toPromise();
        console.log('✅ Appointment created online:', result);
        return result;
      } catch (error) {
        console.error('❌ Failed to create appointment online:', error);
        throw error;
      }
    }

    // Se estiver offline, adiciona à fila
    console.log('📴 Offline detected, adding to queue...');
    const actionId = await this.offlineQueue.addToQueue(
      OfflineActionType.CREATE_APPOINTMENT,
      data
    );

    console.log('✅ Appointment queued for later sync:', actionId);

    return {
      id: actionId,
      offline: true,
      message: 'Agendamento será enviado quando você voltar online'
    };
  }
}
```

### Exemplo: Serviço de Favoritos

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OfflineQueueService, OfflineActionType } from './offline-queue.service';
import { NetworkStatusService } from './network-status.service';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private http = inject(HttpClient);
  private offlineQueue = inject(OfflineQueueService);
  private networkStatus = inject(NetworkStatusService);

  private readonly API_URL = '/api/favorites';

  /**
   * Adicionar favorito - funciona online e offline
   */
  async addFavorite(petId: string, userEmail: string): Promise<any> {
    const data = { petId, userEmail };

    if (this.networkStatus.isOnline()) {
      try {
        return await this.http.post(this.API_URL, data).toPromise();
      } catch (error) {
        console.error('❌ Failed to add favorite online:', error);
        throw error;
      }
    }

    // Offline: adicionar à fila E ao localStorage
    await this.offlineQueue.addToQueue(
      OfflineActionType.ADD_FAVORITE,
      data
    );

    // Também salvar localmente para UI imediata
    this.addToLocalFavorites(petId, userEmail);

    return {
      offline: true,
      message: 'Favorito salvo localmente e será sincronizado'
    };
  }

  /**
   * Remover favorito - funciona online e offline
   */
  async removeFavorite(favoriteId: string): Promise<any> {
    if (this.networkStatus.isOnline()) {
      try {
        return await this.http.delete(`${this.API_URL}/${favoriteId}`).toPromise();
      } catch (error) {
        console.error('❌ Failed to remove favorite online:', error);
        throw error;
      }
    }

    // Offline: adicionar à fila
    await this.offlineQueue.addToQueue(
      OfflineActionType.REMOVE_FAVORITE,
      { favoriteId }
    );

    // Também remover localmente
    this.removeFromLocalFavorites(favoriteId);

    return {
      offline: true,
      message: 'Favorito removido localmente e será sincronizado'
    };
  }

  private addToLocalFavorites(petId: string, userEmail: string): void {
    const favorites = JSON.parse(localStorage.getItem('offline_favorites') || '[]');
    favorites.push({ petId, userEmail, timestamp: Date.now() });
    localStorage.setItem('offline_favorites', JSON.stringify(favorites));
  }

  private removeFromLocalFavorites(favoriteId: string): void {
    const favorites = JSON.parse(localStorage.getItem('offline_favorites') || '[]');
    const filtered = favorites.filter((f: any) => f.id !== favoriteId);
    localStorage.setItem('offline_favorites', JSON.stringify(filtered));
  }
}
```

## Como Usar em Componentes

### Exemplo: Componente de Agendamento

```typescript
import { Component, inject } from '@angular/core';
import { AppointmentService } from '../../core/services/appointment.service';
import { NetworkStatusService } from '../../core/services/network-status.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-appointment-form',
  template: `
    <form (submit)="scheduleVisit()">
      <!-- Form fields -->

      @if (!networkStatus.isOnline()) {
        <div class="offline-warning">
          ⚠️ Você está offline. O agendamento será enviado quando voltar online.
        </div>
      }

      <button type="submit">
        {{ networkStatus.isOnline() ? 'Agendar Visita' : 'Salvar para Enviar Depois' }}
      </button>
    </form>
  `
})
export class AppointmentFormComponent {
  private appointmentService = inject(AppointmentService);
  public networkStatus = inject(NetworkStatusService);
  private toast = inject(ToastService);

  async scheduleVisit(): Promise<void> {
    const data = {
      petId: '123',
      visitorName: 'João Silva',
      visitorEmail: 'joao@example.com',
      preferredDate: '2025-11-10',
      preferredTime: '14:00'
    };

    try {
      const result = await this.appointmentService.createAppointment(data);

      if (result.offline) {
        this.toast.show('Agendamento salvo! Será enviado quando você voltar online.', 'info');
      } else {
        this.toast.show('Agendamento criado com sucesso!', 'success');
      }
    } catch (error) {
      this.toast.show('Erro ao criar agendamento', 'error');
    }
  }
}
```

## Sincronização Automática

O sistema sincroniza automaticamente quando:
1. A rede volta a ficar online (detectado automaticamente)
2. O usuário clica em "Sincronizar" no badge
3. A cada 2 segundos (verifica se deve sincronizar)

## Processamento de Ações

Para que a sincronização funcione, você precisa implementar o processamento no `processAction()` do `OfflineQueueService`:

```typescript
private async processAction(action: OfflineAction): Promise<void> {
  switch (action.type) {
    case OfflineActionType.CREATE_APPOINTMENT:
      await this.http.post('/api/appointments', action.payload).toPromise();
      break;

    case OfflineActionType.ADD_FAVORITE:
      await this.http.post('/api/favorites', action.payload).toPromise();
      break;

    case OfflineActionType.REMOVE_FAVORITE:
      await this.http.delete(`/api/favorites/${action.payload.favoriteId}`).toPromise();
      break;

    case OfflineActionType.CREATE_DONATION:
      await this.http.post('/api/donations', action.payload).toPromise();
      break;

    default:
      console.warn('Unknown action type:', action.type);
  }
}
```

## Retry Logic

O sistema automaticamente:
- Tenta sincronizar até 3 vezes
- Remove ações que falharam 3 vezes
- Mantém ações pendentes para tentar novamente

## IndexedDB

As ações são armazenadas em:
- Database: `aubrigo_offline_db`
- Store: `offline_queue`
- Indexes: `status`, `timestamp`

## Limpeza

Para limpar ações completadas:

```typescript
await offlineQueueService.clearCompleted();
```

## Monitoramento

Para saber quantas ações estão pendentes:

```typescript
const count = await offlineQueueService.getPendingCount();
console.log(`${count} actions pending`);
```
