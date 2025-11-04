import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="screen"><div class="container"><h1>Profile</h1></div></div>`,
  styles: []
})
export class ProfileComponent {}
