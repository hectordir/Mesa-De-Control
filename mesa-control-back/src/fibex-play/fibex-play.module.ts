import { Module } from '@nestjs/common';

import { FibexPlayController } from './fibex-play.controller';
import { FibexPlayService } from './fibex-play.service';

@Module({
  controllers: [FibexPlayController],
  providers: [FibexPlayService],
})
export class FibexPlayModule {}
