import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class ChatDto {
  @IsString()
  prompt: string;

  @IsString()
  model: string;

  @IsOptional()
  @IsBoolean()
  isStream: boolean;

  @IsOptional()
  @IsBoolean()
  isSearch: boolean;

  @IsIn(['TY', 'KIMI'])
  ai: 'TY' | 'KIMI';

  @IsString()
  @IsOptional()
  conversation_id: string;
}
