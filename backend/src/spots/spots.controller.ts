import { Controller, Get } from '@nestjs/common';
import { SpotsService } from './spots.service';

@Controller('spots')
export class SpotsController {
  constructor(private readonly spotsService: SpotsService) {}

  @Get()
  findAll() {
    return this.spotsService.findAll();
  }
}

