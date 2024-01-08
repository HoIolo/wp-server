import { BaseEntity } from 'src/common/entity/base.entity';
import { User } from 'src/modules/user/entity/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

@Entity()
export class Article extends BaseEntity {
  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  @Index()
  author: User;

  @Column()
  title: string;

  @Column()
  type: string;

  @Column()
  description: string;

  @Column()
  pic: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', default: 0 })
  watch_num: number;

  @Column({ type: 'int', default: 0 })
  comment_num: number;

  @Column({ type: 'datetime' })
  publish_date: string;

  @Column({ type: 'simple-array' })
  tags: string[];
}
