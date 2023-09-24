import { PageDTO } from 'src/common/dto/page.dto';

// 分页
export const handlePage = (pageDto: PageDTO) => {
  let { page = 1, offset = 10 } = pageDto;
  if (isNaN(Number(page))) page = Number(page);
  if (isNaN(Number(offset))) offset = Number(offset);
  const skip = ((page as number) - 1) * Number(offset);
  return { skip, offset };
};
