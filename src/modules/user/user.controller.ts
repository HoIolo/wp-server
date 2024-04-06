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
  Req,
  Param,
  Patch,
  ParseIntPipe,
  Inject,
  Delete,
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
  USER_NOT_LOGIN,
  updatePwdError,
  updatePwdMessage,
  GetUserResponseMessage,
  PROHIBITED_MESSAGE,
  COMMON_UPDATE_SUCCESS,
  COMMON_DELETE_SUCCESS,
  SUPER_ADMIN_DELETE_ERROR,
} from './constant';
import { Profile } from './entity/profile.entity';
import { code, roles } from 'src/constant';
import { ProfileDTO } from './dto/profile.dto';
import { Request } from 'express';
import { Role } from 'src/common/decorator/role.decorator';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from './entity/user.entity';
import { Redis } from 'ioredis';
import { UpdatePwdDto } from './dto/updatePwd.dto';
import { isEmpty } from 'src/utils/common';
import { encryptPassword } from 'src/utils/cryptogram';
import { BanUserDto } from './dto/banuser.dto';
import { UpdateUserRoleDto } from './dto/updateUserRole.dto';

@ApiTags('user')
@Controller()
@Role(roles.VISITOR)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
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
   *  根据用户账号查询用户信息
   * @param account
   * @returns
   */
  @Get('/user/:account')
  async getUserByAccount(@Param('account') account: string) {
    // 参数错误
    if (isEmpty(account)) {
      throw new HttpException(
        {
          message: GetUserResponseMessage.PARAMS_ERROR,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const user = await this.userService.findUserByAccount(account);
    // 用户不存在
    if (isEmpty(user)) {
      throw new HttpException(
        {
          message: GetUserResponseMessage.USER_NOT_FOND,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    return {
      row: user,
    };
  }

  /**
   * 获取当前登录用户信息
   * @param req
   * @returns
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('/user')
  async getUser(@Req() req: Request & { user: Profile }) {
    if (!req.user) {
      throw new HttpException(
        {
          message: USER_NOT_LOGIN,
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    const userProfile = await this.userService.findProfileByUid(req.user.id);
    return {
      row: userProfile,
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
    const { account, password, role } = loginDTO;
    const authResult = await this.authService.validateUser(account, password);
    switch (authResult.code) {
      case 1:
        const { id } = authResult.user;
        const profile = await this.userService.findProfileByUid(id, role);
        if (!profile) {
          throw new HttpException(
            { message: loginError.NOT_ACCOUNT, code: code.INVALID_PARAMS },
            HttpStatus.UNAUTHORIZED,
          );
        }
        return await this.authService.login(profile);
      case 2:
        throw new HttpException(
          {
            message: loginError.ACCOUNT_OR_PWD_ERROR,
            code: code.INVALID_PARAMS,
          },
          HttpStatus.UNAUTHORIZED,
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
          HttpStatus.UNAUTHORIZED,
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
  async register(@Body() registerDTO: RegisterDTO) {
    const emailCode = await this.redis.get(registerDTO.email);

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
    // 注册成功，删除验证码
    this.redis.del(registerDTO.email);
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
  @Role(roles.LOGGED)
  @Patch('/user/profile')
  async updateUserProfile(@Body() profileDTO: ProfileDTO, @Req() req: Request) {
    const user = req.user as Profile;
    const result = await this.userService.updateProfile(user.id, profileDTO);

    if (result === null) {
      throw new HttpException(
        {
          message: updateResponseMessage.UPDATE_ERROR,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      message: updateResponseMessage.UPDATE_SUUCCESS,
    };
  }

  /**
   * 忘记密码，修改用户密码
   * @param updatePwdDto
   * @returns
   */
  @Patch('/user/password')
  async updatePassword(@Body() updatePwdDto: UpdatePwdDto) {
    const { oldPassword, newPassword, checkCode, username } = updatePwdDto;
    const user = await this.userService.findPwdByUserName(username);
    // 用户不存在
    if (isEmpty(user)) {
      throw new HttpException(
        {
          message: updatePwdError.USER_NOT_FOND,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const codeCache = await this.redis.get(user.email);
    // 验证码错误
    if (checkCode !== codeCache) {
      throw new HttpException(
        {
          message: updatePwdError.CHECKCODE_ERROR,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    // 旧密码错误
    if (encryptPassword(oldPassword, user.salt) !== user.password) {
      throw new HttpException(
        {
          message: updatePwdError.OLDPWD_ERROR,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    // 新老密码相同
    if (encryptPassword(newPassword, user.salt) === user.password) {
      throw new HttpException(
        {
          message: updatePwdError.NEWPWD_SAMILE_OLDPWD,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const updateResult = await this.userService.updatePwdByUserName(
      username,
      newPassword,
      user.salt,
    );
    // 更新影响行数为0，参数错误
    if (updateResult.affected < 1) {
      throw new HttpException(
        {
          message: updatePwdError.USER_NOT_FOND,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    // 修改成功，删除验证码缓存
    const checkCodeCache = await this.redis.get(user.email);
    // 验证码缓存存在，删除验证码缓存
    if (!isEmpty(checkCodeCache)) this.redis.del(user.email);
    return {
      row: updateResult,
      message: updatePwdMessage.SUCCESS,
    };
  }

  /**
   * 修改用户状态(封禁/解禁)
   * @param id
   * @param banUserDto
   * @returns
   */
  @Patch('/user/:id/ban')
  @Role(roles.ADMIN)
  async banUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() banUserDto: BanUserDto,
  ) {
    const { isBan } = banUserDto;
    const user = await this.userService.findOneById(id);
    if (!user) {
      throw new HttpException(
        {
          message: GetUserResponseMessage.USER_NOT_FOND,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const result = await this.userService.updateUserStatus(id, isBan);
    if (result.affected < 1) {
      throw new HttpException(
        {
          message: SYSTEM_ERROR,
          code: code.SYSTEM_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return {
      message: isBan
        ? PROHIBITED_MESSAGE.PROHIBITED_SUCCESS
        : PROHIBITED_MESSAGE.RELEASE_PROHIBITED_SUCCESS,
    };
  }

  /**
   * 修改用户角色
   * @param id
   * @param updateUserRoleDto
   * @returns
   */
  @Patch('/user/:id/role')
  @Role(roles.SUPER_Admin)
  async updateUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    const { role } = updateUserRoleDto;
    const user = await this.userService.findOneById(id);
    if (!user) {
      throw new HttpException(
        {
          message: GetUserResponseMessage.USER_NOT_FOND,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const updateResult = await this.userService.updateUserRole(id, role);
    if (updateResult.affected < 1) {
      throw new HttpException(
        {
          message: SYSTEM_ERROR,
          code: code.SYSTEM_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return {
      message: COMMON_UPDATE_SUCCESS,
    };
  }

  /**
   * 删除用户
   * @param id
   * @returns
   */
  @Delete('/user/:id')
  @Role(roles.ADMIN)
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.findOneById(id);
    if (!user) {
      throw new HttpException(
        {
          message: GetUserResponseMessage.USER_NOT_FOND,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (user.role > 2) {
      throw new HttpException(
        {
          message: SUPER_ADMIN_DELETE_ERROR,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const result = await this.userService.deleteUser(id);
    if (result.affected < 1) {
      throw new HttpException(
        {
          message: SYSTEM_ERROR,
          code: code.SYSTEM_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return {
      message: COMMON_DELETE_SUCCESS,
    };
  }
}
