import { SetMetadata } from '@nestjs/common';
import { metadata } from '../constant';

export const Role = (arg: number) => SetMetadata(metadata.ROLE, arg);
