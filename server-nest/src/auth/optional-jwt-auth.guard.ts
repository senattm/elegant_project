import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(_err: unknown, user: TUser): TUser {
    return user ?? (null as TUser);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const auth = request.headers?.authorization;
    if (!auth?.startsWith('Bearer ')) {
      request.user = null;
      return true;
    }
    try {
      return (await super.canActivate(context)) as boolean;
    } catch {
      request.user = null;
      return true;
    }
  }
}
