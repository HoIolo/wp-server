import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AIService {
  private readonly API_URL =
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
  private readonly API_KEY = this.configService.get('TY_API_KEY');
  constructor(private readonly configService: ConfigService) {}

  conversation(model: string, body: any) {
    return fetch(this.API_URL, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + this.API_KEY,
        'Content-Type': 'application/json',
        'X-DashScope-SSE': 'enable',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        model,
        input: {
          prompt: body.prompt,
        },
        parameters: {
          incremental_output: body.isStream || false,
        },
      }),
    });
  }
}
