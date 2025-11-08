export class AvailableSlotDto {
  startTime: Date;
  endTime: Date;
  available: boolean;
  reason?: string; // If not available, why?
}
export class AvailableSlotsResponseDto {
  date: string;
  slots: AvailableSlotDto[];
  ongOperatingHours?: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
    lunchBreakStart?: string;
    lunchBreakEnd?: string;
  };
}
export class AvailableDatesResponseDto {
  year: number;
  month: number;
  availableDates: string[]; // Array of date strings (YYYY-MM-DD)
}
