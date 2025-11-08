import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
export interface Response<T> {
  success: boolean;
  data: T;
  message?: string;
}
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => {
        // If data already has success field, return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }
        // If data has message field (like from mutations), preserve it
        if (data && typeof data === 'object' && 'message' in data) {
          return {
            success: true,
            ...data
          };
        }
        // Default wrapper
        return {
          success: true,
          data,
        };
      }),
    );
  }
}
