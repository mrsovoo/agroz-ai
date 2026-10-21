import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix: /v1
  const apiPrefix = configService.get<string>('API_PREFIX', 'v1');
  app.setGlobalPrefix(apiPrefix);

  // CORS configuration
  const rawCors = configService.get<string>(
    'CORS_ORIGINS',
    'https://biznesgo.uz,https://admin.biznesgo.uz',
  );
  const allowedOrigins = rawCors
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.some((allowed) => {
        try {
          return new URL(allowed).origin === new URL(origin).origin;
        } catch {
          return allowed === origin;
        }
      });
      if (isAllowed || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
  });

  // Strict Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // OpenAPI / Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('AgrozGO B2B API')
    .setDescription('Core B2B API for AgrozGO Platform (Starting with Agro & Vet Pharmacy)')
    .setVersion('0.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  const port = configService.get<number>('PORT', 4000);
  await app.listen(port);
  console.log(`[AgrozGO B2B API] Server running on http://localhost:${port}/${apiPrefix}`);
  console.log(`[AgrozGO B2B API] Health check at http://localhost:${port}/${apiPrefix}/health`);
}

void bootstrap();
