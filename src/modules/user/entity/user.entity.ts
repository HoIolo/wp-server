import { Entity, Column, CreateDateColumn, Index, OneToOne } from 'typeorm';
import { Profile } from './profile.entity';
import { BaseEntity } from 'src/common/entity/base.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 25 })
  @Index()
  account: string;

  @Column({ type: 'varchar', length: 25 })
  @Exclude()
  password: string;

  @Column({ type: 'varchar', length: 25 })
  email: string;

  @CreateDateColumn()
  sign_time: string;

  @Column({ type: 'varchar', length: 25 })
  @Exclude()
  salt: string;

  @Column({ type: 'int', default: 1 })
  role: number;

  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Profile;
}
