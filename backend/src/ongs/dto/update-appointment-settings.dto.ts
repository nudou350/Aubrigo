import { PartialType } from '@nestjs/mapped-types';
import { CreateAppointmentSettingsDto } from './create-appointment-settings.dto';

export class UpdateAppointmentSettingsDto extends PartialType(CreateAppointmentSettingsDto) {}
