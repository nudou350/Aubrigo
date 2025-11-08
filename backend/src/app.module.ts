import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PetsModule } from './pets/pets.module';
import { DonationsModule } from './donations/donations.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { FavoritesModule } from './favorites/favorites.module';
import { OngsModule } from './ongs/ongs.module';
import { AdminModule } from './admin/admin.module';
import { UploadModule } from './upload/upload.module';
import { ArticlesModule } from './articles/articles.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CountryModule } from './country/country.module';
@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // TODO: Change to migrations after initial setup
        logging: ['error'],
        ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      }),
    }),
    // Feature modules
    AuthModule,
    UsersModule,
    PetsModule,
    DonationsModule,
    AppointmentsModule,
    FavoritesModule,
    OngsModule,
    AdminModule,
    UploadModule,
    ArticlesModule,
    AnalyticsModule,
    CountryModule,
  ],
})
export class AppModule {}
