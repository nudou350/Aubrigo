import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CountryService, Country } from '../../../core/services/country.service';

@Component({
  selector: 'app-country-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './country-confirmation-dialog.component.html',
  styleUrls: ['./country-confirmation-dialog.component.scss']
})
export class CountryConfirmationDialogComponent implements OnInit {
  isVisible = signal(false);
  detectedCountry = signal<string>('PT');
  countries: { code: string; name: string; flag: string }[] = [
    { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
    { code: 'BR', name: 'Brasil', flag: '🇧🇷' }
  ];

  constructor(private countryService: CountryService) {}

  ngOnInit(): void {
    // Check if confirmation is needed
    if (this.countryService.needsConfirmation()) {
      // Get detected country
      this.detectedCountry.set(this.countryService.getCountry());

      // Show dialog after a short delay to ensure app is loaded
      setTimeout(() => {
        this.isVisible.set(true);
      }, 500);
    }
  }

  selectCountry(countryCode: string): void {
    this.countryService.setCountry(countryCode);
    this.countryService.markAsConfirmed();
    this.closeDialog();
  }

  confirmDetectedCountry(): void {
    this.countryService.markAsConfirmed();
    this.closeDialog();
  }

  closeDialog(): void {
    this.isVisible.set(false);
  }

  getCountryName(code: string): string {
    const country = this.countries.find(c => c.code === code);
    return country ? country.name : code;
  }

  getCountryFlag(code: string): string {
    const country = this.countries.find(c => c.code === code);
    return country ? country.flag : '';
  }
}
