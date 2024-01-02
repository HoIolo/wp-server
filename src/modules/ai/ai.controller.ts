import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { isEmpty } from 'src/utils/common';
import { AIRESPONSE } from './constant';
import { code, roles } from 'src/constant';
import { Role } from 'src/common/decorator/role.decorator';
import { AIService } from './ai.service';

@Controller()
@Role(roles.LOGGED)
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('/ai')
  async ai(
    @Req() req: Request,
    @Res() res: Response,
    @Body('prompt') prompt: string,
    @Body('model') model: string,
  ) {
    if (isEmpty(prompt) || isEmpty(model)) {
      throw new HttpException(
        {
          message: AIRESPONSE.PARAMS_ERROR,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Content-Type', 'text/event-stream');

    const response = await this.aiService.conversation(prompt, model);
    const reader = (response as any).body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const result = new TextDecoder().decode(value);
      res.write(result);
    }
    res.end();

    // 监听客户端断开连接事件
    req.on('close', () => {
      console.log('Client closed connection.');
      res.end();
    });
  }
}
