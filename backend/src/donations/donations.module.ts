import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { Donation } from "./entities/donation.entity";
import { DonationsService } from "./donations.service";
import { DonationsController } from "./donations.controller";
import { PaymentGatewayFactory } from "./gateways/payment-gateway.factory";
import { StripeGateway } from "./gateways/stripe.gateway";
import { BrazilianGateway } from "./gateways/brazilian.gateway";
import { ManualPixGateway } from "./gateways/manual-pix.gateway";
import { Ong } from "../ongs/entities/ong.entity";
import { User } from "../users/entities/user.entity";
import { StripeConnectModule } from "../stripe-connect/stripe-connect.module";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Donation, Ong, User]),
    ConfigModule, // For accessing environment variables in gateways
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
