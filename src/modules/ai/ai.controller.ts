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
import { ChatDto } from './dto/chat.dto';

@Controller()
@Role(roles.LOGGED)
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('/ai')
  async ai(
    @Req() req: Request,
    @Res() res: Response,
    @Body() chatDto: ChatDto,
  ) {
    const { prompt, model, ai } = chatDto;
    if (isEmpty(prompt) || isEmpty(model)) {
      throw new HttpException(
        {
          message: AIRESPONSE.PARAMS_ERROR,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const aiMap = {
      TY: 'tyConversation',
      KIMI: 'kimiConversation',
    };

    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Content-Type', 'text/event-stream');

    const response = await this.aiService[aiMap[ai]](model, chatDto);

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
