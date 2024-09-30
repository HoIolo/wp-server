import { QueryDTO } from './dto/query.dto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from './entity/user.entity';
import { Profile } from './entity/profile.entity';
import { RegisterDTO } from './dto/register.dto';
import { encryptPassword, makeSalt } from 'src/utils/cryptogram';
import { SYSTEM_ERROR } from './constant';
import { code } from 'src/constant';
import { ProfileDTO } from './dto/profile.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profilesRepository: Repository<Profile>,
    private dataSource: DataSource,
  ) {}

  // 获取总用户数量
  getTotal() {
    return this.usersRepository.count();
  }

  /**
   * 根据用户账号查询用户
   * @param account
   */
  findUserByAccount(account: string) {
    return this.usersRepository.findOne({
      where: {
        account,
      },
      select: ['id', 'account', 'email', 'role'],
    });
  }

  /**
   * 查询用户，支持分页
   * @param queryDTO
   * @returns
   */
  find(queryDTO: QueryDTO) {
    let { page = 1, offset = 10 } = queryDTO;
    const { field, keyword, searchType, admin } = queryDTO;
    if (isNaN(Number(page))) page = Number(page);
    if (isNaN(Number(offset))) offset = Number(offset);
    const skip = ((page as number) - 1) * Number(offset);

    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.account',
        'user.email',
        'user.role',
        'user.status',
        'user.createTime',
      ])
      .leftJoinAndMapOne(
        'user.profile',
        Profile,
        'profile',
        'profile.user_id = user.id',
      );
    if (admin == 'true') {
      queryBuilder.andWhere('user.role >= :role', { role: 2 });
    }
    if (field && keyword) {
      if (searchType === 'like') {
        queryBuilder.andWhere(`${field} like :keyword`, {
          keyword: `%${keyword}%`,
        });
      } else {
        queryBuilder.andWhere(`${field} ${searchType} :keyword`, { keyword });
      }
    }

    return queryBuilder
      .skip(skip)
      .take(offset as number)
      .getManyAndCount();
  }

  /**
   * 按用户名查询
   * @param account
   * @returns
   */
  findOne(account: string) {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('user.account = :account', {
        account,
      })
      .getOne();
  }

  /**
   * 按id查询
   * @param account
   * @returns
   */
  findOneById(id: number) {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('user.id = :id', {
        id,
      })
      .getOne();
  }

  /**
   * 按照uid查询用户资料
   * @param uid
   * @returns
   */
  async findProfileByUid(user_id: number, role?: number) {
    const queryBuilder = this.profilesRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .where('user.id = :userId', { userId: user_id });
    if (role) {
      queryBuilder.andWhere('user.role >= :role', { role });
    }
    const result = await queryBuilder.getOne();
    if (result) result.user = plainToClass(User, result.user);
    return result;
  }

  saveUser(registerDTO: RegisterDTO) {
    const user = new User();
    user.salt = makeSalt();
    const saveUser = Object.assign(user, registerDTO) as User;
    return this.usersRepository.save(saveUser);
  }

  saveProfile(uid: number, name: string) {
    const profile = new Profile();
    const saveProfile = Object.assign(profile, { uid, name });
    return this.profilesRepository.save(saveProfile);
  }

  /**
   * 创建用户
   * @param registerDTO
   * @returns
   */
  async createUser(registerDTO: RegisterDTO) {
    const user = new User();
    user.salt = makeSalt();
    // 密码加密
    registerDTO.password = encryptPassword(registerDTO.password, user.salt);
    const mergeUser = Object.assign(user, registerDTO) as User;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const saveUser = await queryRunner.manager.save(mergeUser);

      if (!saveUser) {
        return null;
      }

      const profile = new Profile();
      const mergeProfile = Object.assign(profile, {
        user_id: saveUser.id,
        name: saveUser.account,
        user: saveUser,
      });

      const saveProfile = await queryRunner.manager.save<Profile>(mergeProfile);

      await queryRunner.commitTransaction();

      return saveProfile;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        {
          message: SYSTEM_ERROR,
          code: code.SYSTEM_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 更新用户资料
   * @param id
   * @param profileDTO
   * @returns
   */
  updateProfile(id: number, profileDTO: ProfileDTO) {
    if (!id || Object.values(profileDTO).length === 0) {
      return null;
    }
    return this.profilesRepository
      .createQueryBuilder()
      .update()
      .set(profileDTO)
      .where('id = :id', { id })
      .execute();
  }

  /**
   * 文章数量+1
   * @param id
   * @returns
   */
  incrementArticleNum(id: number | string) {
    return this.profilesRepository.increment({ user: {id: +id} }, 'article_num', 1);
  }

  /**
   * 按照用户名查询密码
   * @param userName
   * @returns
   */
  findPwdByUserName(userName: string) {
    return this.usersRepository.findOne({
      where: {
        account: userName,
      },
      select: ['password', 'salt', 'email'],
    });
  }

  /**
   * 根据用户名修改密码
   * @param userName
   * @param newPwd
   * @param salt
   * @returns
   */
  updatePwdByUserName(userName: string, newPwd: string, salt: string) {
    return this.usersRepository.update(
      {
        account: userName,
      },
      {
        password: encryptPassword(newPwd, salt),
      },
    );
  }

  /**
   * 匹配角色
   * @param _role
   * @param uid
   * @returns
   */
  async matchRole(_role: number, uid: number): Promise<boolean> {
    const user = await this.usersRepository.findOneBy({
      id: uid,
    });
    const role = user && user.role;
    return role ? role >= _role : false;
  }

  /**
   * 修改用户状态
   * @param uid
   * @param flag
   * false: 表示解除封禁, true: 表示封禁用户
   * @returns
   */
  updateUserStatus(uid: number, flag: boolean) {
    const status = flag ? 0 : 1;
    return this.usersRepository.update({ id: uid }, { status });
  }

  /**
   * 修改用户角色
   * @param uid
   * @param role
   * @returns
   */
  updateUserRole(uid: number, role: number) {
    return this.usersRepository.update({ id: uid }, { role });
  }

  /**
   * 软删除用户
   * @param uid
   * @returns
   */
  deleteUser(uid: number) {
    return this.usersRepository.softDelete({ id: uid });
  }
}
