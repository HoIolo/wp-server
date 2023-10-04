import { BaseEntity } from 'src/common/entity/base.entity';
import { Article } from 'src/modules/article/entity/article.entity';
import { User } from 'src/modules/user/entity/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Reply } from './reply.entity';

@Entity()
export class Comment extends BaseEntity {
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user: User;

  @ManyToOne(() => Article, { nullable: false })
  @JoinColumn({ name: 'article_id' })
  @Index()
  article_id: Article;

  @Column({ type: 'varchar', length: 255 })
  content: string;

  @Column({ type: 'int', default: 0 })
  likes: number;

  @OneToMany(() => Reply, (reply) => reply.comment)
  replys: Reply[];
}
