import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyFormat',
  standalone: true
})
export class CurrencyFormatPipe implements PipeTransform {
  transform(value: number | null | undefined, currencyCode = 'EUR', showSymbol = true): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '-';
    }

    const currency = currencyCode.toUpperCase();

    // Define locale and formatting options based on currency
    let locale = 'pt-PT';
    const formatOptions: Intl.NumberFormatOptions = {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    };

    if (currency === 'BRL') {
      locale = 'pt-BR';
      formatOptions.style = 'currency';
      formatOptions.currency = 'BRL';
    } else if (currency === 'EUR') {
      locale = 'pt-PT';
      formatOptions.style = 'currency';
      formatOptions.currency = 'EUR';
    } else {
      // Default to EUR formatting
      locale = 'pt-PT';
      formatOptions.style = 'currency';
      formatOptions.currency = 'EUR';
    }

    try {
      const formatted = new Intl.NumberFormat(locale, formatOptions).format(value);
      return formatted;
    } catch (error) {
      console.error('Error formatting currency:', error);
      return `${value.toFixed(2)}`;
    }
  }
}
