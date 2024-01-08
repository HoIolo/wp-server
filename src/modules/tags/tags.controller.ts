import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { ApiTags } from '@nestjs/swagger';
import { Role } from 'src/common/decorator/role.decorator';
import { code, roles } from 'src/constant';
import { Tags } from './entity/tags.entity';
import { GetTagsDto } from './dto/getTags.dto';
import { INVALID_PARAMS, TAG_EXIST_ALREADY, TAG_NOT_EXIST } from './constant';
import { CreateTagDto } from './dto/createTag.dto';
import { UpdateTagDto } from './dto/updateTag.dto';
import { SYSTEM_ERROR } from '../user/constant';

@ApiTags('tags')
@Controller()
@Role(roles.VISITOR)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  /**
   * 获取标签列表
   * @param getTagsDto
   * @returns
   */
  @Get('/tags')
  async getTags(@Query() getTagsDto: GetTagsDto) {
    const { sorted } = getTagsDto;
    if (sorted && sorted !== 'DESC' && sorted !== 'ASC') {
      throw new HttpException(
        {
          message: INVALID_PARAMS,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const [tags, count] = await this.tagsService.findAll(getTagsDto);
    return {
      rows: tags,
      count,
    };
  }

  /**
   * 创建标签
   * @param createTagDto
   * @returns
   */
  @Post('/tag')
  async createTag(@Body() createTagDto: CreateTagDto) {
    const { tagName } = createTagDto;
    const findTag = await this.tagsService.findOneByIdOrName({ name: tagName });
    if (findTag) {
      // 标签已经存在
      throw new HttpException(
        {
          message: TAG_EXIST_ALREADY,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const tag = new Tags();
    tag.tagName = tagName;
    const createResult = await this.tagsService.create(tag);
    return {
      row: createResult,
    };
  }

  /**
   * 更新标签名称
   * @param updateTagDto
   * @returns
   */
  @Patch('/tag/:id')
  async updateTag(
    @Body() updateTagDto: UpdateTagDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const { tagName } = updateTagDto;
    const findTag = await this.tagsService.findOneByIdOrName({ id });
    if (!findTag) {
      // 标签不存在
      throw new HttpException(
        {
          message: TAG_NOT_EXIST,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const updateResult = await this.tagsService.updateTag(id, tagName);
    if (updateResult.affected < 1) {
      // 更新失败
      throw new HttpException(
        {
          message: SYSTEM_ERROR,
          code: code.SYSTEM_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return {
      row: updateResult,
    };
  }

  /**
   * 通过id删除标签
   * @param id
   * @returns
   */
  @Delete('/tag/:id')
  async delTag(@Param('id', ParseIntPipe) id: number) {
    const findTag = await this.tagsService.findOneByIdOrName({ id });
    if (!findTag) {
      // 标签不存在
      throw new HttpException(
        {
          message: TAG_NOT_EXIST,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const deleteResult = await this.tagsService.deleteTag(id);
    return {
      row: deleteResult,
    };
  }
}
