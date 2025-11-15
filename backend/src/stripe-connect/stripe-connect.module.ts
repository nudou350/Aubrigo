import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StripeConnectService } from "./stripe-connect.service";
import { StripeConnectController } from "./stripe-connect.controller";
import { Ong } from "../ongs/entities/ong.entity";

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Ong])],
  controllers: [StripeConnectController],
  providers: [StripeConnectService],
  exports: [StripeConnectService],
})
export class StripeConnectModule {}
