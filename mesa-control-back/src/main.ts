import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { configureApp } from './setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  // '0.0.0.0': en contenedores (Railway) el proxy no alcanza un listener en localhost.
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
void bootstrap();
