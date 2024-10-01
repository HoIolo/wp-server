import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ArticleType } from "./entity/articleType.entity";
import { Repository } from "typeorm";
import { GetArticleTypeDTO } from "./dto/getArtilceType.dto";
import { handlePage } from "src/utils/common";
import { CreateArticleTypeDto } from "./dto/createArticleType.dto";
import { UpdateArticleTypeDto } from "./dto/updateArticleType.dto";

@Injectable()
export class ArticleTypeService {
    private readonly acticles: string = 'articles';

    constructor(
        @InjectRepository(ArticleType)
        private readonly articleTypeRepository: Repository<ArticleType>,
    ) { }

    /**
     * 分页查询
     * @param getArticleTypeDto 
     * @returns 
     */
    find(getArticleTypeDto: GetArticleTypeDTO) {
        const { field, keyword, sorted = 'DESC' } = getArticleTypeDto;
        const { skip, offset } = handlePage(getArticleTypeDto);
        const queryBuild = this.articleTypeRepository
          .createQueryBuilder()
          .skip(skip)
          .take(offset as number)
          .orderBy('id', sorted);
       if (field && keyword) {
          queryBuild.andWhere(`article.${field} like :keyword`, {
            keyword: `%${keyword}%`,
          });
        }
    
        return queryBuild.getManyAndCount();
    }

    /**
     * 创建文章分类
     * @param createArticleTypeDto 
     * @returns 
     */
    create(createArticleTypeDto: CreateArticleTypeDto) {
        const articleType = new ArticleType();
        articleType.name = createArticleTypeDto.name;
        return this.articleTypeRepository.save(articleType);
    }

    /**
     * 删除文章分类
     * @param id 
     * @returns 
     */
    delete(id: number) {
        return this.articleTypeRepository.softDelete(id);
    }
    
    /**
     * 根据ID查询文章分类
     * @param id 
     * @returns 
     */
    findById(id: number) {
        return this.articleTypeRepository.findOne({ where: {id}, relations: [this.acticles] });
    }

    /**
     * 根据名称查询文章分类
     * @param name 
     * @returns 
     */
    findByName(name: string) {
        return this.articleTypeRepository.find( { where: { name }, relations: [this.acticles] });
    }

    /**
     * 更新文章分类
     * @param id 
     * @param updateArticleTypeDto 
     * @returns 
     */
    update(id: number, updateArticleTypeDto: UpdateArticleTypeDto) {
        const { name } = updateArticleTypeDto;
        return this.articleTypeRepository.update(id, { name });
    }
    
}