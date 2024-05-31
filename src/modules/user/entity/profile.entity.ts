import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entity/base.entity';
import { User } from './user.entity';

@Entity()
export class Profile extends BaseEntity {
  @Index()
  @OneToOne(() => User, (user) => user.profile, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  name: string;

  @Column({ nullable: true })
  signature: string;

  @Column({
    default:
      'https://gw.alicdn.com/i4/710600684/O1CN01bNcLnV1GvJd3wK1k2_!!710600684.jpg_Q75.jpg_.webp',
  })
  avatar: string;

  @Column({ default: 0 })
  sex: number;

  @Column({ default: 0 })
  article_num: number;

  @Column()
  qq_no: string;

  @Column()
  github_url: string;

  @Column()
  bilibili_url: string;
}
