import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class ReplyCommentDto {
  @IsNumber()
  @ApiProperty()
  user_id: number;

  @IsNumber()
  @ApiProperty()
  comment_id: number;

  @IsString()
  @ApiProperty()
  content: string;
}
