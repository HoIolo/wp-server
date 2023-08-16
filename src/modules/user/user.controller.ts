import { UserService } from './user.service';
import { QueryDTO } from './dto/query.dto';
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
  Req,
  Param,
  Patch,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthService } from 'src/modules/auth/auth.service';
import { LoginDTO } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { RegisterDTO } from './dto/register.dto';
import {
  loginError,
  registerError,
  REGISTER_SUCCESS,
  SYSTEM_ERROR,
  updateResponseMessage,
} from './constant';
import { Profile } from './entity/profile.entity';
import { code, roles } from 'src/constant';
import { ProfileDTO } from './dto/profile.dto';
import { Request } from 'express';
import { Role } from 'src/common/decorator/role.decorator';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from './entity/user.entity';

@ApiTags('user')
@Controller()
@Role(roles.VISITOR)
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
   * 获取当前登录用户信息
   * @param req
   * @returns
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('/user')
  getUser(@Req() req: Request & { user: Profile }) {
    return {
      row: req.user,
    };
  }

  /**
   * 登录
   * @param loginDTO
   * @returns
   */
  @Post('/login')
  @ApiResponse({
    description: '用户登陆接口',
    type: User,
  })
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
          {
            message: loginError.ACCOUNT_OR_PWD_ERROR,
            code: code.INVALID_PARAMS,
          },
          HttpStatus.BAD_REQUEST,
        );
      default:
        throw new HttpException(
          { message: loginError.NOT_ACCOUNT, code: code.INVALID_PARAMS },
          HttpStatus.BAD_REQUEST,
        );
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
      throw new HttpException(
        { message: registerError.EMAIL_CODE_ERROR, code: code.INVALID_PARAMS },
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.userService.findOne(registerDTO.account);
    // 校验用户是否已经存在
    if (user) {
      throw new HttpException(
        { message: loginError.ACCOUNT_EXIST, code: code.INVALID_PARAMS },
        HttpStatus.BAD_REQUEST,
      );
    }

    const saveUser = await this.userService.createUser(registerDTO);
    if (!saveUser)
      throw new HttpException(
        { message: SYSTEM_ERROR, code: code.SYSTEM_ERROR },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    return {
      message: REGISTER_SUCCESS,
    };
  }

  /**
   * 修改用户资料（需登录, 按照id修改）
   * 管理员
   * @param id
   * @param profileDTO
   * @returns
   */
  @UseGuards(AuthGuard('jwt'))
  @Role(roles.ADMIN)
  @Patch('/user/profile/:id')
  async updateUserProfileById(
    @Param('id', ParseIntPipe) id: number,
    @Body() profileDTO: ProfileDTO,
  ) {
    const result = await this.userService.updateProfile(id, profileDTO);
    if (result === null) {
      return {
        message: updateResponseMessage.UPDATE_ERROR,
      };
    }
    return {
      message: updateResponseMessage.UPDATE_SUUCCESS,
    };
  }

  /**
   * 修改用户资料（需登录）
   * @param profileDTO
   * @returns
   */
  @UseGuards(AuthGuard('jwt'))
  @Patch('/user/profile')
  async updateUserProfile(@Body() profileDTO: ProfileDTO, @Req() req: Request) {
    const user = req.user as Profile;
    const result = await this.userService.updateProfile(user.id, profileDTO);
    if (result === null) {
      return {
        message: updateResponseMessage.UPDATE_ERROR,
      };
    }
    return {
      message: updateResponseMessage.UPDATE_SUUCCESS,
    };
  }
}
