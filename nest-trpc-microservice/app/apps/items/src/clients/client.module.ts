import { Module } from '@nestjs/common';
import { CLIENTS } from './client.interface';
import { ConfigService } from '@nestjs/config';
import { createPaymentsClient } from './payments.client';

@Module({
  providers: [
    {
      provide: CLIENTS,
      useFactory: (configService: ConfigService): Clients => ({
        paymentClient: createPaymentsClient(
          configService.getOrThrow('PAYMENTS_URL'),
        ),
      }),
      inject: [ConfigService],
    },
  ],
  exports: [CLIENTS],
})
export class ClientModule {}
