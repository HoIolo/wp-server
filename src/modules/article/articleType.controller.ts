import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Role } from "src/common/decorator/role.decorator";
import { code, roles } from "src/constant";
import { ArticleTypeService } from "./articleType.service";
import { GetArticleTypeDTO } from "./dto/getArtilceType.dto";
import { CustomResponseData } from "src/common/types/common.type";
import { UpdateArticleTypeDto } from "./dto/updateArticleType.dto";
import { CreateArticleTypeDto } from "./dto/createArticleType.dto";
import { ADD_ARTICLE_TYPE_ERROR } from "./constant";

@ApiTags('article_type')
@Controller()
@Role(roles.VISITOR)
export class ArticleTypeController {

    constructor(private readonly articleTypeService: ArticleTypeService) {}

    // 获取文章类型
    @Get('/article/types')
    async getArticleTypes(@Query() getArticleTypeDto: GetArticleTypeDTO): Promise<CustomResponseData> {
        const [data, total] = await this.articleTypeService.find(getArticleTypeDto);
        return {
            rows: data,
            count: total
        }
    }

    // 创建文章类型
    @Post('/article/type')
    @Role(roles.ADMIN)
    async create(@Body() createArticleTypeDto: CreateArticleTypeDto): Promise<CustomResponseData> {
        const { name } = createArticleTypeDto
        const findArticleType = await this.articleTypeService.findByName(name);
        // 判断文章类型是否存在
        if (findArticleType && findArticleType.length > 0) {
            throw new HttpException( {
                message: ADD_ARTICLE_TYPE_ERROR.ARTICLE_TYPE_ALREADY_EXIST,
                code: code.INVALID_PARAMS,
              },
              HttpStatus.BAD_REQUEST,)
        }
        const data = await this.articleTypeService.create(createArticleTypeDto);
        return {
            row: data
        };
    }

    // 根据文章类型id获取文章
    @Get('/article/type/:id')
    async getArticleTypeById(@Param('id', ParseIntPipe) id: number): Promise<CustomResponseData> {
        const data = await this.articleTypeService.findById(id);
        return {
            row: data
        };
    }

    // 删除文章类型
    @Delete('/article/type/:id')
    @Role(roles.ADMIN)
    async delete(@Param('id', ParseIntPipe) id: number): Promise<CustomResponseData> {
        const result = await this.articleTypeService.delete(id)
        return {
            row: result
        };  
    }

    // 根据文章类型名称查询文章类型
    @Get('/article/type/name/:name')
    async getArticleTypeByName(@Param('name') name: string): Promise<CustomResponseData> {
        const data = await this.articleTypeService.findByName(name)
        return {
            row: data
        };
    }

    @Patch('/article/type/:id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateArticleTypeDto: UpdateArticleTypeDto): Promise<CustomResponseData> {
        const result = await this.articleTypeService.update(id, updateArticleTypeDto)
        return {
            row: result
        };
    }
}