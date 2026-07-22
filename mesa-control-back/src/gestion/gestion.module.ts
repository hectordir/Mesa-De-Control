import { Module } from '@nestjs/common';

import { GestionController } from './gestion.controller';
import { GestionService } from './gestion.service';

@Module({
  controllers: [GestionController],
  providers: [GestionService],
})
export class GestionModule {}
