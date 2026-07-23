import { Module } from '@nestjs/common';

import { GestionAppController } from './gestion-app.controller';
import { GestionAppService } from './gestion-app.service';

@Module({
  controllers: [GestionAppController],
  providers: [GestionAppService],
})
export class GestionAppModule {}
