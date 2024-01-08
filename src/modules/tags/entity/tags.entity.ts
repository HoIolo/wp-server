import { BaseEntity } from 'src/common/entity/base.entity';
import { Article } from 'src/modules/article/entity/article.entity';
import { Column, Entity, ManyToMany } from 'typeorm';

@Entity()
export class Tags extends BaseEntity {
  @Column({ type: 'char', length: 15, name: 'tag_name', nullable: true })
  tagName: string;

  @Column({ type: 'int', name: 'by_num', nullable: true, default: 0 })
  byNum: number;

  @ManyToMany(() => Article, (article) => article.tagsEntity)
  byArticles: Article[];
}
