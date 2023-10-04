import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class PublishCommentDTO {
  @IsNumber()
  @ApiProperty()
  user_id: number;

  @IsNumber()
  @ApiProperty()
  article_id: number;

  @IsString()
  @ApiProperty()
  content: string;
}
