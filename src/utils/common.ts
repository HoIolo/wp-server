import { PageDTO } from 'src/common/dto/page.dto';

// 分页
export const handlePage = (pageDto: PageDTO) => {
  let { page = 1, offset = 10 } = pageDto;
  if (isNaN(Number(page))) page = Number(page);
  if (isNaN(Number(offset))) offset = Number(offset);
  const skip = ((page as number) - 1) * Number(offset);
  return { skip, offset };
};

/**
 *  判断是否为空
 * @param value
 * @returns
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === 'string' || Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }

  return false;
};

/**
 *  获取时间戳文件名
 * @returns
 */
export const getTimeStampFileName = () => {
  const date = new Date();
  const signature = 'xiaoxi666';
  const random1 = Math.floor(Math.random() * signature.length - 1) + 1;
  const random2 = Math.floor(Math.random() * signature.length - 1) + 1;
  const endCharatacter =
    random1 > random2
      ? signature.substring(random2, random1)
      : signature.substring(random1, random2);
  return date.getTime() + endCharatacter;
};
