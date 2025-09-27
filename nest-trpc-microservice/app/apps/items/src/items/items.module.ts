import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { ClientModule } from 'src/clients/client.module';

@Module({
  imports: [ClientModule],
  providers: [ItemsService],
  controllers: [ItemsController],
})
export class ItemsModule {}
