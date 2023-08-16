import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { code } from '../../constant';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const [req] = context.getArgs();

    return next.handle().pipe(
      map((data) => {
        return {
          code: code.SUCCESS,
          data,
          path: req.url,
          timestamp: new Date().toLocaleString(),
          message: '请求成功',
        };
      }),
    );
  }
}
