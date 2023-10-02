import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as session from 'express-session';
import { HttpExceptionFilter } from './common/filter/http-exception.filter';
import { TransformInterceptor } from './common/interceptor/transform.interceptor';

// api文档插件
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import getLogLevels from './utils/getLogLevels';
import { AllExceptionFilter } from './common/filter/all-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: getLogLevels(process.env.NODE_ENV === 'production'),
  });
  app.enableCors({
    origin: [process.env.ALLOW_ORIGIN],
    methods: '*',
    credentials: true,
  });

  app.use(
    session({
      secret: 'my-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        //	允许跨站和同站请求中均发送cookie
        sameSite: 'none',
        secure: true,
        maxAge: 1000 * 60 * 30,
      },
    }),
  );
  // 设置全局访问前缀
  app.setGlobalPrefix('/api/v1');
  // 设置全局http异常过滤器
  app.useGlobalFilters(new AllExceptionFilter(), new HttpExceptionFilter());
  // 设置全局参数验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      enableDebugMessages: true,
    }),
  );
  // 设置全局拦截器
  app.useGlobalInterceptors(new TransformInterceptor());

  const options = new DocumentBuilder()
    .setTitle('小析blog API服务')
    .setDescription('使用nest书写的小析blog API服务') // 文档介绍
    .setVersion('1.0.0') // 文档版本
    // .setBasePath('http://localhost:5000')
    .build();
  // 为了创建完整的文档（具有定义的HTTP路由），我们使用类的createDocument()方法SwaggerModule。此方法带有两个参数，分别是应用程序实例和基本Swagger选项。
  const document = SwaggerModule.createDocument(app, options);
  // 最后一步是setup()。它依次接受（1）装入Swagger的路径，（2）应用程序实例, （3）描述Nest应用程序的文档。
  SwaggerModule.setup('/api', app, document);

  await app.listen(3000);
}
bootstrap();
