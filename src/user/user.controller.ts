import { UserService } from './user.service';
import { QueryDTO } from './../common/dto/query.dto';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
  Session,
} from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { LoginDTO } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { RegisterDTO } from './dto/register.dto';
import {
  loginError,
  registerError,
  REGISTER_SUCCESS,
  SYSTEM_ERROR,
} from './constant';

@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('/users')
  async getUsers(@Query() queryDTO: QueryDTO) {
    const [rows, count] = await this.userService.find(queryDTO);
    return {
      rows,
      count,
    };
  }

  /**
   * 登录
   * @param loginDTO
   * @returns
   */
  @Post('/login')
  async login(@Body() loginDTO: LoginDTO) {
    const authResult = await this.authService.validateUser(
      loginDTO.account,
      loginDTO.password,
    );
    switch (authResult.code) {
      case 1:
        const { id } = authResult.user;
        const profile = await this.userService.findProfileByUid(id);
        return await this.authService.login(profile);
      case 2:
        throw new HttpException(
          loginError.ACCOUNT_OR_PWD_ERROR,
          HttpStatus.BAD_REQUEST,
        );
      default:
        throw new HttpException(loginError.NOT_ACCOUNT, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 注册
   * @param registerDTO
   * @param session
   * @returns
   */
  @Post('/user')
  async register(
    @Body() registerDTO: RegisterDTO,
    @Session() session: Record<string, any>,
  ) {
    const { emailCode } = session;
    // 校验验证码
    if (!emailCode || emailCode != registerDTO.email_code) {
      throw new HttpException(registerError.EMAIL_CODE_ERROR, 400);
    }

    const user = await this.userService.findOne(registerDTO.account);
    // 校验用户是否已经存在
    if (user) {
      throw new HttpException(loginError.NOT_ACCOUNT, HttpStatus.BAD_REQUEST);
    }

    const saveUser = await this.userService.createUser(registerDTO);
    if (!saveUser)
      throw new HttpException(SYSTEM_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);

    return {
      message: REGISTER_SUCCESS,
    };
  }
}
