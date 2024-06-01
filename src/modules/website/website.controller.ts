import { WebsiteService } from './website.service';
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
import { ApiTags } from '@nestjs/swagger';
import { Role } from 'src/common/decorator/role.decorator';
import { COMMON_RESPONSE_MSG, code, roles } from 'src/constant';
import { GetSettingDto } from './dto/getSetting.dto';
import { CreateSettingDto } from './dto/createSetting.dto';
import { WebsiteSetting } from './entity/websiteSetting.entity';
import { UpdateSettingDto } from './dto/updateSetting.dto';
import { CustomResponseData } from 'src/common/types/common.type';

@ApiTags('website')
@Controller('/website')
@Role(roles.VISITOR)
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  /**
   * 分页查询网站设置
   * @param getSettingDto
   * @returns
   */
  @Get('/setting')
  async getSettingInfo(
    @Query() getSettingDto: GetSettingDto,
  ): Promise<CustomResponseData> {
    const [websiteSettings, count] =
      await this.websiteService.findSetting(getSettingDto);
    return {
      rows: websiteSettings,
      count,
    };
  }

  /**
   * 新增网站设置
   * @param createSettingDto
   * @returns
   */
  @Post('/setting')
  async createSetting(
    @Body() createSettingDto: CreateSettingDto,
  ): Promise<CustomResponseData> {
    const { typed_text, logo_text, footer_text } = createSettingDto;
    const websiteSetting = new WebsiteSetting();
    websiteSetting.typed_text = typed_text;
    websiteSetting.logo_text = logo_text;
    websiteSetting.footer_text = footer_text;
    const result = await this.websiteService.create(websiteSetting);
    if (!result) {
      throw new HttpException(
        {
          message: COMMON_RESPONSE_MSG.SYSTEM_ERROR,
          code: code.SYSTEM_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return {
      row: 'ok',
    };
  }

  /**
   * 更新网站设置
   * @param updateSettingDto
   * @returns
   */
  @Patch('/setting/:id')
  async updateSetting(
    @Body() updateSettingDto: UpdateSettingDto,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CustomResponseData> {
    const result = await this.websiteService.update(updateSettingDto, id);
    return {
      row: result,
    };
  }

  /**
   * 删除网站设置
   * @param id
   * @returns
   */
  @Delete('/setting/:id')
  async deleteSetting(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CustomResponseData> {
    const result = await this.websiteService.delete(id);
    return {
      row: result,
    };
  }
}
