import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { userProfileRules, usersex } from '../constant';
import { ApiProperty } from '@nestjs/swagger';

export class ProfileDTO {
  @IsOptional()
  @IsString()
  @MinLength(userProfileRules.username.MIN_LENGTH)
  @MaxLength(userProfileRules.username.MAX_LENGTH)
  @ApiProperty({
    required: false,
    description: '昵称',
  })
  name: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(userProfileRules.usersign.MAX_LENGTH)
  @ApiProperty({
    required: false,
    description: '个性签名',
  })
  signature: string;

  @IsOptional()
  @IsUrl()
  @ApiProperty({
    required: false,
    description: '头像',
  })
  avatar: string;

  @IsOptional()
  @ApiProperty({
    required: false,
    description: '性别',
  })
  sex: usersex;

  @IsOptional()
  @ApiProperty({
    required: false,
    description: 'QQ号',
  })
  qq_no: string;

  @IsOptional()
  @ApiProperty({
    required: false,
    description: 'GitHub主页链接',
  })
  @IsUrl()
  github_url: string;

  @IsOptional()
  @ApiProperty({
    required: false,
    description: '哔哩哔哩空间链接',
  })
  @IsUrl()
  bilibili_url: string;
}
