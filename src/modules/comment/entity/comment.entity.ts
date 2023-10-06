import { BaseEntity } from 'src/common/entity/base.entity';
import { Article } from 'src/modules/article/entity/article.entity';
import { User } from 'src/modules/user/entity/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
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
  article: Article;

  @Column({ type: 'varchar', length: 255 })
  content: string;

  @JoinTable({
    joinColumn: { name: 'comment_id' },
    inverseJoinColumn: { name: 'user_id' },
  })
  @ManyToMany(() => User)
  likes: User[];

  @OneToMany(() => Reply, (reply) => reply.comment)
  replys: Reply[];
}
