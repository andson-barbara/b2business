import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';

import express = require('express');
import bodyParser = require('body-parser');

async function bootstrap() {
  const server = express();

  // Captura o body bruto ANTES do Nest consumir/parsing
  server.use(
    bodyParser.json({
      verify: (req: any, _res: any, buf: Buffer) => {
        req.rawBody = buf;
      },
    }),
  );

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
    {
      // ✅ essencial: impede o Nest de registrar outro body parser
      bodyParser: false,
    },
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

bootstrap();
