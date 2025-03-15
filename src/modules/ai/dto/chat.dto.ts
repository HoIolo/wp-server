import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

interface Message {
  role: string;
  content: string;
}

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

  @IsIn(['TY', 'KIMI', 'SF'])
  ai: 'TY' | 'KIMI' | 'SF';

  @IsString()
  @IsOptional()
  conversation_id: string;

  @IsOptional()
  @IsArray()
  messages: Message[];

  @IsOptional()
  @IsNumber()
  max_tokens: number;
}
