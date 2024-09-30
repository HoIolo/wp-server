import { BaseEntity } from 'src/common/entity/base.entity';
import { Tags } from 'src/modules/tags/entity/tags.entity';
import { User } from 'src/modules/user/entity/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
} from 'typeorm';
import { ArticleType } from './articleType.entity';

@Entity()
export class Article extends BaseEntity {
  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  @Index()
  author: User;

  @Column()
  title: string;

  @ManyToOne(() => ArticleType, (type) => type.articles)
  @JoinColumn({ name: 'type_id' })
  @Index()
  type: ArticleType;

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

  @ManyToMany(() => Tags, (tags) => tags.byArticles)
  @JoinTable({
    name: 'article_tags',
    joinColumn: { name: 'article_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tagsEntity: Tags[];
}
