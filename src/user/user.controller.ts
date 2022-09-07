import { UserService } from './user.service';
import { QueryDTO } from './../common/dto/query.dto';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { LoginDTO } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';

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
        return {
          message: '账号或者密码不正确',
        };
      default:
        return {
          message: '该账号不存在',
        };
    }
  }
}
