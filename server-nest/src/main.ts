import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useStaticAssets(join(process.cwd(), 'public', 'images'), {
    prefix: '/images',
  });

  app.useStaticAssets(join(process.cwd(), 'public', 'videos'), {
    prefix: '/videos',
  });

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Elegant API')
    .setDescription('Elegant e-ticaret platformu API dokümantasyonu')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'JWT token girin',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Kimlik doğrulama işlemleri')
    .addTag('products', 'Ürün işlemleri')
    .addTag('cart', 'Sepet işlemleri')
    .addTag('favorites', 'Favori işlemleri')
    .addTag('orders', 'Sipariş işlemleri')
    .addTag('addresses', 'Adres işlemleri')
    .addTag('payment', 'Ödeme işlemleri')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 5000;
  await app.listen(port);

  console.log(`NestJS server ${port} portunda çalışıyor`);
  console.log(`Swagger dokümantasyonu: http://localhost:${port}/api/docs`);
}
bootstrap();
