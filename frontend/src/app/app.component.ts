import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent, ToastComponent],
  template: `
    <div class="app-container">
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      <app-bottom-nav></app-bottom-nav>
      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .main-content {
      flex: 1;
      padding-bottom: 68px; /* Height of bottom navigation on mobile */
      background: #ffffff;
    }

    /* Desktop: Add top padding for fixed top navigation */
    @media (min-width: 1024px) {
      .main-content {
        padding-top: 88px; /* Height of larger top navigation */
        padding-bottom: 0;
      }
    }
  `],
})
export class AppComponent {
  title = 'Aubrigo';
}
