import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="screen">
      <div class="container">
        <h1 style="padding-top: 48px;">Bem-vindo ao Pet SOS!</h1>
        <p class="mt-md">Esta é a página inicial onde os pets estarão listados.</p>
        <div class="mt-xl" style="text-align: center;">
          <p>🐕 🐈 🐠 🐹</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class HomeComponent {}
