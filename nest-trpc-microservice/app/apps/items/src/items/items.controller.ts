import { Body, Controller, Post } from '@nestjs/common';
import { CreateItemRequest } from './dto/create-item.request';
import { ItemsService } from './items.service';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  async createItem(@Body() request: CreateItemRequest) {
    return this.itemsService.createItem(request);
  }
}
