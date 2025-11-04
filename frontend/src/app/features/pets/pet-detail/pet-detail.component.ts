import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pet-detail',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="screen"><div class="container"><h1>Pet Detail</h1></div></div>`,
  styles: []
})
export class PetDetailComponent {}
