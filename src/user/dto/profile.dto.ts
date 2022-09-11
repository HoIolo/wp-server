import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { userProfileRules, usersex } from '../constant';

export class ProfileDTO {
  @IsOptional()
  @IsString()
  @MinLength(userProfileRules.username.MIN_LENGTH)
  @MaxLength(userProfileRules.username.MAX_LENGTH)
  name: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(userProfileRules.usersign.MAX_LENGTH)
  signature: string;

  @IsOptional()
  @IsUrl()
  avatar: string;

  @IsOptional()
  @IsIn(Object.values(userProfileRules.usersex))
  sex: usersex;
}
