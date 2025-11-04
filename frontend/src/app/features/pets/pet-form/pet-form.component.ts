import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pet-form',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="screen"><div class="container"><h1>Pet Form</h1></div></div>`,
  styles: []
})
export class PetFormComponent {}
