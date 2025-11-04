import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="screen">
      <div class="container">
        <h1>Register Component</h1>
        <p>Registration form will be implemented here.</p>
      </div>
    </div>
  `,
  styles: []
})
export class RegisterComponent {}
