import { Column, Entity, OneToMany, Unique } from "typeorm";
import { Article } from "./article.entity";
import { BaseEntity } from "src/common/entity/base.entity";

@Entity()
export class ArticleType extends BaseEntity {
    @Column({ length: 20 })
    @Unique('type_name_unique', ['name'])
    name: string;

    @OneToMany(() => Article, (article) => article.type)
    articles: Article[]
}