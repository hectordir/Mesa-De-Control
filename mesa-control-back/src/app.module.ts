import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { validateEnv } from './config/env.validation';
import { DashboardModule } from './dashboard/dashboard.module';
import { GestionModule } from './gestion/gestion.module';
import { OperadoresModule } from './operadores/operadores.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    AuthModule,
    DashboardModule,
    GestionModule,
    OperadoresModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
