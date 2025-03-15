import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from 'src/common/decorator/role.decorator';
import { code, roles } from 'src/constant';
import { VisitorService } from './visitor.service';
import {
  CreateVisitorDTO,
  GetVisitorDTO,
  UpdateVisitorDTO,
} from './dto/visitor.dto';
import { IncrementVisitorDTO } from './dto/increment-visitor.dto';
import {
  DATE_FORMAT_REGEX,
  DATE_FORMAT_ERROR_MESSAGE,
  DATE_NOT_FOUND_ERROR_MESSAGE,
} from './constant';

@ApiTags('visitor')
@Controller('/website/visitor')
@Role(roles.VISITOR)
export class VisitorController {
  constructor(private readonly visitorService: VisitorService) {}

  @Post()
  @ApiOperation({ summary: '创建访问记录' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(@Body() createVisitorDto: CreateVisitorDTO) {
    return this.visitorService.createOrUpdate(createVisitorDto);
  }

  @Post('increment')
  @ApiOperation({ summary: '增加访问量' })
  @ApiResponse({ status: 200, description: '增加成功' })
  async increment(@Body() incrementVisitorDto: IncrementVisitorDTO) {
    const { date } = incrementVisitorDto;
    return this.visitorService.incrementVisitor(date, 1);
  }

  @Get('range')
  @ApiOperation({ summary: '获取指定日期范围的访问记录' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getByDateRange(@Query() getVisitorDto: GetVisitorDTO) {
    return this.visitorService.findByDateRange(getVisitorDto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有访问记录' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAll() {
    return this.visitorService.findAll();
  }

  @Get('total')
  @ApiOperation({ summary: '获取总访问量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTotal() {
    return this.visitorService.getTotalVisits();
  }

  @Get(':date')
  @ApiOperation({ summary: '获取指定日期的访问记录' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getByDate(@Param('date') date: string) {
    if (!date.match(DATE_FORMAT_REGEX)) {
      throw new HttpException(
        {
          message: DATE_FORMAT_ERROR_MESSAGE,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.visitorService.findByDate(date);
  }

  @Put(':date')
  @ApiOperation({ summary: '更新指定日期的访问记录' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @Param('date') date: string,
    @Body() updateVisitorDto: UpdateVisitorDTO,
  ) {
    if (!date.match(DATE_FORMAT_REGEX)) {
      throw new HttpException(
        {
          message: DATE_FORMAT_ERROR_MESSAGE,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const result = await this.visitorService.update(date, updateVisitorDto);
    if (!result) {
      throw new HttpException(
        {
          message: DATE_NOT_FOUND_ERROR_MESSAGE,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    return result;
  }
}
