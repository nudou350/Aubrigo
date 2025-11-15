import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { Donation } from "./entities/donation.entity";
import { DonationsService } from "./donations.service";
import { DonationsController } from "./donations.controller";
import { PaymentGatewayFactory } from "./gateways/payment-gateway.factory";
import { StripeGateway } from "./gateways/stripe.gateway";
import { BrazilianGateway } from "./gateways/brazilian.gateway";
import { ManualPixGateway } from "./gateways/manual-pix.gateway";
import { User } from "../users/entities/user.entity";
import { StripeConnectModule } from "../stripe-connect/stripe-connect.module";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Donation, User]),
    ConfigModule, // For accessing environment variables in gateways
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Default: 60 seconds
        limit: 10, // Default: 10 requests per minute
      },
    ]),
    StripeConnectModule,
    EmailModule,
  ],
  controllers: [DonationsController],
  providers: [
    DonationsService,
    PaymentGatewayFactory,
    StripeGateway,
    BrazilianGateway,
    ManualPixGateway,
  ],
  exports: [TypeOrmModule, DonationsService],
})
export class DonationsModule {}
