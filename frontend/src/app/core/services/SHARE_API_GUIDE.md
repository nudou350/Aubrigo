# Web Share API - Guia Completo

## Visão Geral

O Web Share API e Share Target API permitem que usuários compartilhem conteúdo do app para outras plataformas e recebam conteúdo compartilhado de outros apps.

---

## 1. Web Share API (Compartilhar DE dentro do app)

### Verificar Suporte

```typescript
import { ShareService } from './core/services/share.service';

const shareService = inject(ShareService);

if (shareService.isShareSupported()) {
  // Web Share API disponível
}
```

### Compartilhar Conteúdo Simples

```typescript
const shared = await shareService.share({
  title: 'Título do conteúdo',
  text: 'Descrição',
  url: 'https://aubrigo.com/pets/123'
});

if (shared) {
  console.log('Compartilhado com sucesso!');
}
```

### Compartilhar Pet

```typescript
const pet = {
  id: '123',
  name: 'Max',
  species: 'Cachorro',
  location: 'Lisboa',
  imageUrl: 'https://...'
};

await shareService.sharePet(pet);
```

### Compartilhar ONG

```typescript
const ong = {
  id: '456',
  name: 'ONG Animais Felizes',
  location: 'Porto'
};

await shareService.shareOng(ong);
```

---

## 2. Usando o Componente ShareButton

### Básico

```typescript
import { ShareButtonComponent } from '@shared/components/share-button/share-button.component';

@Component({
  template: `
    <app-share-button
      [shareData]="{
        title: 'Max - Aubrigo',
        text: 'Conheça o Max, um cachorro adorável!',
        url: '/pets/123'
      }">
    </app-share-button>
  `,
  imports: [ShareButtonComponent]
})
```

### Modo Compacto (apenas ícone)

```typescript
@Component({
  template: `
    <app-share-button
      [compact]="true"
      [shareData]="petShareData">
    </app-share-button>
  `
})
export class PetDetailComponent {
  petShareData = {
    title: 'Max - Aubrigo',
    text: 'Adote o Max!',
    url: window.location.href
  };
}
```

### Customizar Texto do Botão

```typescript
<app-share-button
  buttonText="Compartilhar Pet"
  [shareData]="shareData">
</app-share-button>
```

---

## 3. Compartilhamento em Plataformas Específicas

### WhatsApp

```typescript
const link = shareService.getWhatsAppShareLink(
  'Conheça o Max!',
  'https://aubrigo.com/pets/123'
);

window.open(link, '_blank');
```

### Facebook

```typescript
const link = shareService.getFacebookShareLink('https://aubrigo.com/pets/123');
window.open(link, '_blank');
```

### Twitter

```typescript
const link = shareService.getTwitterShareLink(
  'Adote o Max no Aubrigo!',
  'https://aubrigo.com/pets/123'
);

window.open(link, '_blank');
```

### Email

```typescript
const link = shareService.getEmailShareLink(
  'Confira este pet para adoção',
  'Olá! Encontrei este pet adorável: https://aubrigo.com/pets/123'
);

window.open(link);
```

### Copiar Link

```typescript
const success = await shareService.copyToClipboard('https://aubrigo.com/pets/123');

if (success) {
  console.log('Link copiado!');
}
```

---

## 4. Share Target API (Receber conteúdo compartilhado)

### Configuração do Manifest

Já configurado em `manifest.webmanifest`:

```json
{
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        {
          "name": "images",
          "accept": ["image/*"]
        }
      ]
    }
  }
}
```

### Como Funciona

1. Usuário compartilha conteúdo de outro app (ex: Chrome, WhatsApp)
2. Sistema mostra "Aubrigo" como opção de compartilhamento
3. Usuário seleciona Aubrigo
4. App abre na rota `/share` com os dados compartilhados

### Rota de Compartilhamento

Adicione ao `app.routes.ts`:

```typescript
{
  path: 'share',
  loadComponent: () => import('./features/share/share.component').then(m => m.ShareComponent)
}
```

### Processar Dados Compartilhados

No `share.component.ts`, os dados chegam via:
- **Query params** (para GET)
- **Form data** (para POST - requer backend intermediário)

```typescript
ngOnInit() {
  this.route.queryParams.subscribe(params => {
    this.sharedContent = {
      title: params['title'],
      text: params['text'],
      url: params['url']
    };
  });
}
```

---

## 5. Backend para Share Target (Opcional)

Se quiser processar POST requests do Share Target, crie um endpoint:

### NestJS Example

```typescript
@Controller('share')
export class ShareController {
  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  async handleShare(
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    const { title, text, url } = body;

    // Processar dados compartilhados
    console.log('Shared:', { title, text, url, files });

    // Redirecionar para o frontend com query params
    return {
      redirect: `/share?title=${encodeURIComponent(title || '')}&text=${encodeURIComponent(text || '')}&url=${encodeURIComponent(url || '')}`
    };
  }
}
```

---

## 6. Service Worker para Share Target

Adicione ao `ngsw-config.json` para cache da rota:

```json
{
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "urls": [
          "/share"
        ]
      }
    }
  ]
}
```

---

## 7. Exemplos de Uso no App

### Pet Detail Page

```typescript
@Component({
  selector: 'app-pet-detail',
  template: `
    <div class="pet-detail">
      <img [src]="pet.imageUrl" />
      <h1>{{ pet.name }}</h1>

      <app-share-button
        [shareData]="{
          title: pet.name + ' - Aubrigo',
          text: 'Conheça ' + pet.name + ', disponível para adoção!',
          url: '/pets/' + pet.id
        }">
      </app-share-button>
    </div>
  `
})
export class PetDetailComponent {
  pet: Pet;
}
```

### ONG Profile Page

```typescript
@Component({
  template: `
    <div class="ong-profile">
      <h1>{{ ong.name }}</h1>

      <button (click)="shareOng()">
        Compartilhar ONG
      </button>
    </div>
  `
})
export class OngProfileComponent {
  shareService = inject(ShareService);
  ong: Ong;

  async shareOng() {
    await this.shareService.shareOng({
      id: this.ong.id,
      name: this.ong.name,
      location: this.ong.location
    });
  }
}
```

### Home Page - Share App

```typescript
@Component({
  template: `
    <button (click)="shareApp()">
      Compartilhar Aubrigo
    </button>
  `
})
export class HomeComponent {
  shareService = inject(ShareService);

  async shareApp() {
    await this.shareService.shareApp();
  }
}
```

---

## 8. Testes

### Testar Web Share API

1. Build em produção:
```bash
ng build
```

2. Serve com HTTPS:
```bash
npx http-server dist/aubrigo/browser -p 4200 --ssl
```

3. Abrir no celular (necessário HTTPS real ou ngrok)

4. Clicar em "Compartilhar" e verificar opções

### Testar Share Target

1. Instalar PWA no dispositivo

2. Abrir outro app (Chrome, WhatsApp, etc)

3. Compartilhar um link ou imagem

4. Selecionar "Aubrigo" na lista

5. Verificar se abre na página `/share`

---

## 9. Suporte de Navegadores

| Recurso | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| Web Share API | ✅ | ✅ | ✅ | ✅ |
| Share Files | ✅ | ✅ (iOS 15+) | ❌ | ✅ |
| Share Target | ✅ (Android) | ❌ | ❌ | ✅ (Windows) |

---

## 10. Boas Práticas

1. **Sempre verificar suporte antes de usar**
   ```typescript
   if (shareService.isShareSupported()) {
     // Usar Web Share
   } else {
     // Fallback para links sociais
   }
   ```

2. **Fornecer fallbacks**
   - ShareButton já inclui links diretos para redes sociais

3. **Textos descritivos**
   - Use títulos e textos claros
   - Inclua CTAs (Call to Action)

4. **URLs absolutas**
   - Sempre use URLs completas: `https://aubrigo.com/pets/123`

5. **Tracking de shares**
   - Adicione parâmetros UTM para analytics:
   ```typescript
   url: 'https://aubrigo.com/pets/123?utm_source=share&utm_medium=web_share'
   ```

---

## 11. Limitações

- **iOS Safari**: Share Target não suportado (Web Share funciona)
- **Desktop**: Share Target não funciona (Web Share funciona em alguns browsers)
- **HTTPS Obrigatório**: Ambos APIs requerem HTTPS
- **PWA Instalado**: Share Target só funciona com PWA instalado

---

## Referências

- [MDN: Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API)
- [MDN: Share Target API](https://developer.mozilla.org/en-US/docs/Web/Manifest/share_target)
- [Can I Use: Web Share](https://caniuse.com/web-share)
