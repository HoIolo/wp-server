import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateVisitorDTO {
  @ApiProperty({ description: '访问日期', example: '2023-01-01' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: '访问次数', example: 1 })
  @IsInt()
  count: number;

  @ApiProperty({ description: '备注', example: '新年访问', required: false })
  @IsString()
  @IsOptional()
  remark?: string;
}

export class GetVisitorDTO {
  @ApiProperty({ description: '开始日期', example: '2023-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: '结束日期', example: '2023-01-31' })
  @IsDateString()
  endDate: string;
}

export class UpdateVisitorDTO {
  @ApiProperty({ description: '访问次数', example: 1 })
  @IsInt()
  @IsOptional()
  count?: number;

  @ApiProperty({ description: '备注', example: '新年访问', required: false })
  @IsString()
  @IsOptional()
  remark?: string;
}
