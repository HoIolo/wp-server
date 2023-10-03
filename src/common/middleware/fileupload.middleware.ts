import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { mkdirSync, existsSync } from 'fs';

@Injectable()
export class FileUploadMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const uploadDestination = this.configService.get('UPLOAD_IMAGE_PATH');
    if (!existsSync(uploadDestination)) {
      // Create directory if it doesn't exist
      mkdirSync(uploadDestination, { recursive: true });
    }

    next();
  }
}
