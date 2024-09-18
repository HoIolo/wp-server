import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { LoginDTO } from './dto/login.dto';
import { UserService } from '../user/user.service';
import { loginError } from '../user/constant';
import { code, roles } from 'src/constant';
import { AuthService } from './auth.service';
import { Role } from 'src/common/decorator/role.decorator';
import { isEmpty } from 'class-validator';
import { RESPONSE_MSG } from './constant';

@Controller('auth')
@Role(roles.VISITOR)
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  /**
   * 登录
   * @param loginDTO
   */
  @Post('login')
  async login(@Body() loginDTO: LoginDTO) {
    const { account, password, role } = loginDTO;
    const authResult = await this.authService.validateUser(account, password);
    switch (authResult.code) {
      case 1:
        const { id } = authResult.user;
        const profile = await this.userService.findProfileByUid(id, role);
        if (!profile) {
          throw new HttpException(
            { message: loginError.NOT_ACCOUNT, code: code.INVALID_PARAMS },
            HttpStatus.BAD_REQUEST,
          );
        }
        return await this.authService.login(profile);
      case 2:
        throw new HttpException(
          {
            message: loginError.ACCOUNT_OR_PWD_ERROR,
            code: code.INVALID_PARAMS,
          },
          HttpStatus.BAD_REQUEST,
        );
      case 3:
        throw new HttpException(
          {
            message: loginError.USER_IS_BAN,
            code: code.USER_IS_BLOCKED,
          },
          HttpStatus.FORBIDDEN,
        );
      default:
        throw new HttpException(
          { message: loginError.NOT_ACCOUNT, code: code.INVALID_PARAMS },
          HttpStatus.BAD_REQUEST,
        );
    }
  }

  /**
   * 刷新token
   */
  @Get('refresh')
  async refreshToken(@Query('refresh_token') refresh_token: string) {
    if (isEmpty(refresh_token)) {
      throw new HttpException(
        {
          message: RESPONSE_MSG.REFRESH_TOKEN_EMPTY,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const { refresh_token: new_refresh_token, access_token } =
      await this.authService.refresh(refresh_token);
    if (isEmpty(access_token) || isEmpty(new_refresh_token)) {
      throw new HttpException(
        {
          message: RESPONSE_MSG.REFRESH_TOKEN_INVALID,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    return {
      refresh_token: new_refresh_token,
      access_token,
    };
  }
}
