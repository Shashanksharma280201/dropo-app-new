import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  userId: string;
  phoneNumber: string;
}

export const CurrentUser = createParamDecorator<CurrentUserPayload | undefined>(
  (_, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.user as CurrentUserPayload | undefined;
  },
);
