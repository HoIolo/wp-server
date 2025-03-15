import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AIService {
  private readonly TY_API_URL = this.configService.get('TY_API_URL');
  private readonly TY_API_KEY = this.configService.get('TY_API_KEY');
  private readonly KIMI_API_KEY = this.configService.get('KIMI_API_KEY');
  private readonly KIMI_API_URL = this.configService.get('KIMI_API_URL');
  private readonly SF_API_URL = this.configService.get('SF_API_URL');
  private readonly SF_API_KEY = this.configService.get('SF_API_KEY');
  constructor(private readonly configService: ConfigService) {}

  /**
   * 通义千问 问答
   * @param model
   * @param body
   * @returns
   */
  tyConversation(model: string, body: any) {
    return fetch(this.TY_API_URL, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + this.TY_API_KEY,
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

  /**
   * kimi 问答
   * @param model
   * @param body
   * @returns
   */
  kimiConversation(model: string, body: any) {
    return fetch(this.KIMI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + this.KIMI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        conversation_id: body.conversation_id,
        messages: [
          {
            role: 'user',
            content: body.prompt,
          },
        ],
        // 是否开启联网搜索，默认false
        use_search: body.isSearch || false,
        // 如果使用SSE流请设置为true，默认false
        stream: body.isStream || false,
      }),
    });
  }

  /**
   * 硅基流动 问答
   * @param model
   * @param body
   * @returns
   */
  sfConversation(model: string, body: any) {
    return fetch(this.SF_API_URL, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + this.SF_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: body.messages || [
          {
            role: 'user',
            content: body.prompt,
          },
        ],
        stream: body.isStream || false,
        max_tokens: body.max_tokens || 512,
        temperature: 0.6,
        top_p: 0.7,
        top_k: 50,
        frequency_penalty: 0.0,
        n: 1,
        response_format: {
          type: 'text',
        },
      }),
    });
  }
}
