import { QueryDTO } from './../common/dto/query.dto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from './entity/user.entity';
import { Profile } from './entity/profile.entity';
import { RegisterDTO } from './dto/register.dto';
import { encryptPassword, makeSalt } from 'src/utils/cryptogram';
import { SYSTEM_ERROR } from './constant';
import { code } from 'src/common/constant';
import { ProfileDTO } from './dto/profile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profilesRepository: Repository<Profile>,
    private dataSource: DataSource,
  ) {}

  /**
   * 查询用户，支持分页
   * @param queryDTO
   * @returns
   */
  find(queryDTO: QueryDTO) {
    let { page = 1, offset = 10 } = queryDTO;
    if (isNaN(Number(page))) page = Number(page);
    if (isNaN(Number(offset))) offset = Number(offset);
    const skip = ((page as number) - (offset as number)) * Number(offset);
    return this.usersRepository
      .createQueryBuilder()
      .skip(skip)
      .limit(offset as number)
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
   * 按照uid查询用户资料
   * @param uid
   * @returns
   */
  findProfileByUid(uid: number) {
    return this.profilesRepository.findOneBy({
      uid,
    });
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
        uid: saveUser.id,
        name: saveUser.account,
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
}
