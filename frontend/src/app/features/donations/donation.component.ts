import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-donation',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="screen"><div class="container"><h1>Donation</h1></div></div>`,
  styles: []
})
export class DonationComponent {}
