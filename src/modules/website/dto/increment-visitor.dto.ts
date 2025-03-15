import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class IncrementVisitorDTO {
  @ApiProperty({ description: '访问日期', example: '2023-01-01' })
  @IsDateString({}, { message: '日期格式无效，请使用YYYY-MM-DD格式' })
  date: string;
}
