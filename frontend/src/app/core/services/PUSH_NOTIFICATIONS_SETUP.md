# Push Notifications - Guia de Configuração

## Visão Geral

Sistema completo de Push Notifications usando Web Push API com VAPID keys.

## Pré-requisitos

- Service Worker ativo (PWA configurado)
- HTTPS habilitado (obrigatório para push notifications)
- Backend para gerenciar subscriptions

---

## 1. Gerar VAPID Keys

VAPID (Voluntary Application Server Identification) keys são necessárias para autenticar o servidor.

### Instalar web-push

```bash
npm install -g web-push
```

### Gerar Keys

```bash
npx web-push generate-vapid-keys
```

Resultado:
```
=======================================

Public Key:
BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U

Private Key:
tUZGXYG2-PK4ilarTPYvaQ9b12Ccw==

=======================================
```

### Adicionar ao Frontend

Edite `push-notification.service.ts`:

```typescript
private readonly VAPID_PUBLIC_KEY = 'SUA_PUBLIC_KEY_AQUI';
```

### Adicionar ao Backend

Edite `.env`:

```env
VAPID_PUBLIC_KEY=SUA_PUBLIC_KEY_AQUI
VAPID_PRIVATE_KEY=SUA_PRIVATE_KEY_AQUI
VAPID_SUBJECT=mailto:seu-email@example.com
```

---

## 2. Backend Setup (NestJS)

### Instalar Dependências

```bash
npm install web-push
npm install @types/web-push --save-dev
```

### Criar Push Notification Module

```bash
nest g module push-notifications
nest g service push-notifications
nest g controller push-notifications
```

### push-notifications.service.ts

```typescript
import { Injectable } from '@nestjs/common';
import * as webPush from 'web-push';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

@Injectable()
export class PushNotificationsService {
  constructor() {
    // Configure VAPID keys
    webPush.setVapidDetails(
      process.env.VAPID_SUBJECT,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY,
    );
  }

  /**
   * Save subscription to database
   */
  async saveSubscription(subscription: any, userEmail?: string): Promise<void> {
    // TODO: Save to database
    // Example with TypeORM:
    // await this.subscriptionRepository.save({
    //   endpoint: subscription.endpoint,
    //   p256dh: subscription.keys.p256dh,
    //   auth: subscription.keys.auth,
    //   userEmail,
    //   userAgent: subscription.userAgent,
    //   createdAt: new Date(),
    // });

    console.log('Subscription saved:', subscription);
  }

  /**
   * Remove subscription from database
   */
  async removeSubscription(endpoint: string): Promise<void> {
    // TODO: Remove from database
    // await this.subscriptionRepository.delete({ endpoint });

    console.log('Subscription removed:', endpoint);
  }

  /**
   * Send notification to a specific subscription
   */
  async sendNotification(
    subscription: PushSubscription,
    payload: any,
  ): Promise<void> {
    try {
      await webPush.sendNotification(
        subscription,
        JSON.stringify(payload),
      );
      console.log('Notification sent successfully');
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Send notification to all subscribers
   */
  async sendToAll(payload: any): Promise<void> {
    // TODO: Get all subscriptions from database
    // const subscriptions = await this.subscriptionRepository.find();

    // for (const sub of subscriptions) {
    //   try {
    //     await this.sendNotification({
    //       endpoint: sub.endpoint,
    //       keys: {
    //         p256dh: sub.p256dh,
    //         auth: sub.auth,
    //       },
    //     }, payload);
    //   } catch (error) {
    //     console.error('Failed to send to subscription:', error);
    //   }
    // }

    console.log('Sent to all subscribers');
  }

  /**
   * Send notification to users by email
   */
  async sendToUser(userEmail: string, payload: any): Promise<void> {
    // TODO: Get user subscriptions from database
    // const subscriptions = await this.subscriptionRepository.find({
    //   where: { userEmail },
    // });

    // for (const sub of subscriptions) {
    //   await this.sendNotification({
    //     endpoint: sub.endpoint,
    //     keys: {
    //       p256dh: sub.p256dh,
    //       auth: sub.auth,
    //     },
    //   }, payload);
    // }

    console.log('Sent to user:', userEmail);
  }
}
```

### push-notifications.controller.ts

```typescript
import { Controller, Post, Delete, Body } from '@nestjs/common';
import { PushNotificationsService } from './push-notifications.service';

@Controller('api/push-notifications')
export class PushNotificationsController {
  constructor(
    private readonly pushNotificationsService: PushNotificationsService,
  ) {}

  @Post('subscribe')
  async subscribe(@Body() body: any) {
    const { subscription, userEmail } = body;
    await this.pushNotificationsService.saveSubscription(subscription, userEmail);
    return { success: true, message: 'Subscribed successfully' };
  }

  @Delete('unsubscribe')
  async unsubscribe(@Body() body: any) {
    const { endpoint } = body;
    await this.pushNotificationsService.removeSubscription(endpoint);
    return { success: true, message: 'Unsubscribed successfully' };
  }

  @Post('send')
  async sendNotification(@Body() body: any) {
    const { userEmail, title, message, data } = body;

    const payload = {
      notification: {
        title,
        body: message,
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data,
      },
    };

    if (userEmail) {
      await this.pushNotificationsService.sendToUser(userEmail, payload);
    } else {
      await this.pushNotificationsService.sendToAll(payload);
    }

    return { success: true, message: 'Notification sent' };
  }
}
```

### Database Schema (TypeORM)

```typescript
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('push_subscriptions')
export class PushSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  endpoint: string;

  @Column()
  p256dh: string;

  @Column()
  auth: string;

  @Column({ nullable: true })
  userEmail: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

---

## 3. Uso no Frontend

### Em Componentes

```typescript
import { Component, inject } from '@angular/core';
import { PushNotificationService } from './core/services/push-notification.service';

@Component({
  selector: 'app-settings',
  template: `
    <app-notification-settings></app-notification-settings>
  `
})
export class SettingsComponent {
  private pushService = inject(PushNotificationService);

  async enableNotifications() {
    const subscribed = await this.pushService.subscribe('user@example.com');
    if (subscribed) {
      console.log('Notifications enabled!');
    }
  }
}
```

### Verificar Status

```typescript
const isSubscribed = await this.pushService.isSubscribed();
const permission = this.pushService.getPermissionStatus(); // 'granted' | 'denied' | 'default'
const isSupported = this.pushService.isSupported();
```

---

## 4. Trigger Notifications no Backend

### Exemplo: Novo Pet Cadastrado

```typescript
// Em pet.service.ts
async createPet(createPetDto: CreatePetDto): Promise<Pet> {
  const pet = await this.petRepository.save(createPetDto);

  // Enviar notificação para usuários da região
  await this.pushNotificationsService.sendToRegion(pet.location, {
    notification: {
      title: 'Novo pet disponível! 🐶',
      body: `${pet.name} está disponível para adoção perto de você`,
      icon: pet.imageUrl,
      data: {
        type: 'NEW_PET_IN_AREA',
        petId: pet.id,
        url: `/pets/${pet.id}`,
      },
      actions: [
        {
          action: 'view_pet',
          title: 'Ver Pet',
        },
        {
          action: 'close',
          title: 'Fechar',
        },
      ],
    },
  });

  return pet;
}
```

### Exemplo: Confirmação de Agendamento

```typescript
// Em appointment.service.ts
async confirmAppointment(appointmentId: string): Promise<void> {
  const appointment = await this.appointmentRepository.findOne(appointmentId);

  await this.pushNotificationsService.sendToUser(appointment.visitorEmail, {
    notification: {
      title: 'Agendamento confirmado! ✅',
      body: `Sua visita para conhecer ${appointment.pet.name} foi confirmada`,
      icon: appointment.pet.imageUrl,
      data: {
        type: 'APPOINTMENT_CONFIRMED',
        appointmentId: appointment.id,
        url: `/appointments/${appointment.id}`,
      },
    },
  });
}
```

---

## 5. Service Worker Configuration

Adicione ao `ngsw-config.json`:

```json
{
  "push": {
    "enabled": true
  }
}
```

---

## 6. Testes

### Teste Local

1. Build em produção:
```bash
ng build
```

2. Serve com HTTPS:
```bash
npx http-server dist/aubrigo/browser -p 4201 --ssl
```

3. Abra no navegador e teste:
   - Ativar notificações
   - Enviar notificação de teste
   - Verificar se aparece

### Teste de Payload

```typescript
const testPayload = {
  notification: {
    title: 'Teste de Notificação',
    body: 'Esta é uma notificação de teste do Aubrigo',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'Explorar',
      },
      {
        action: 'close',
        title: 'Fechar',
      },
    ],
  },
};
```

---

## 7. Troubleshooting

### Notificações não aparecem

1. Verificar permissão:
```javascript
console.log(Notification.permission); // deve ser 'granted'
```

2. Verificar service worker:
```javascript
navigator.serviceWorker.ready.then(reg => {
  console.log('Service Worker ready:', reg);
});
```

3. Verificar subscription:
```javascript
const sub = await pushService.getSubscription();
console.log('Subscription:', sub);
```

### Erro: "Registration failed - no Service Worker"

- Certifique-se de estar em HTTPS
- Build em modo produção: `ng build`
- Service Worker só funciona em produção

### Erro: "Push notification permission denied"

- Usuário bloqueou notificações
- Limpar site data e tentar novamente
- No Chrome: Configurações > Privacidade > Configurações do site > Notificações

---

## 8. Boas Práticas

1. **Não envie notificações demais** - Máximo 1-2 por dia
2. **Respeite preferências** - Permita usuários desativar tipos específicos
3. **Use ações úteis** - Botões que levem o usuário a páginas relevantes
4. **Teste em múltiplos dispositivos** - iOS, Android, Desktop
5. **Handle erros gracefully** - Remova subscriptions inválidas
6. **Use badges** - Ícones pequenos para melhor experiência
7. **Vibração sutil** - Pattern: [200, 100, 200]

---

## 9. Limitações

- **iOS**: Push notifications só funcionam em PWAs instalados (não no Safari)
- **Desktop**: Funciona em Chrome, Firefox, Edge
- **Requer HTTPS**: Não funciona em localhost (exceto para testes)
- **Rate limits**: Servidores push têm limites de taxa

---

## Referências

- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [web-push library](https://github.com/web-push-libs/web-push)
- [VAPID spec](https://tools.ietf.org/html/draft-ietf-webpush-vapid-01)
