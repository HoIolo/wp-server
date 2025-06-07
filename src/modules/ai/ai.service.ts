import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { getArticleReviewPrompt } from './propmt';

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

  /**
   * 文章审核
   * @param title 文章标题
   * @param content 文章内容
   * @returns {Promise<{approved: number, reason?: string, category?: string, confidence?: number}>} 返回审核结果
   */
  async reviewArticle(
    title: string,
    content: string,
  ): Promise<{
    approved: number;
    reason?: string;
    category?: string;
    confidence?: number;
  }> {
    try {
      const model = 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B';
      const prompt = getArticleReviewPrompt(title, content);

      const response = await this.sfConversation(model, {
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        isStream: false,
        max_tokens: 1024, // 增加token限制，确保AI有足够空间回复
      });
      const result = await response.json();
      let reviewResult;

      try {
        // 尝试解析AI返回的内容
        if (result?.choices?.[0]?.message) {
          const aiResponse = result.choices[0].message.content;

          // 处理可能的markdown格式JSON
          let jsonContent = aiResponse;

          // 检查是否包含markdown代码块
          const markdownJsonRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
          const markdownMatch = aiResponse.match(markdownJsonRegex);

          if (markdownMatch && markdownMatch[1]) {
            // 提取markdown代码块中的JSON内容
            jsonContent = markdownMatch[1];
          }

          const parsedResponse = JSON.parse(jsonContent);

          // 构建审核结果，保留所有字段，并转换approved为数字状态
          reviewResult = {
            // 布尔值转换为数字状态：true -> 2(通过)，false -> 0(待审核)
            approved: parsedResponse.approved ? 2 : 0,
            category: parsedResponse.category || '',
            reason: parsedResponse.approved
              ? parsedResponse.reason || ''
              : `[${parsedResponse.category || '违规内容'}] ${
                  parsedResponse.reason || '内容不符合社区规范'
                }`,
            confidence: parsedResponse.confidence || 0,
          };
        } else {
          // 如果无法正确获取结果，默认为待审核状态
          reviewResult = { approved: 0 };
        }
      } catch (error) {
        // 如果解析JSON失败，默认为待审核状态
        reviewResult = { approved: 0 };
        Logger.warn(`AI审核结果解析失败: ${error.message}`, 'AIService');
      }
      return reviewResult;
    } catch (error) {
      // 如果调用AI服务出错，默认为待审核状态
      Logger.error(`AI审核服务调用失败: ${error.message}`, 'AIService');
      return { approved: 0 };
    }
  }
}
