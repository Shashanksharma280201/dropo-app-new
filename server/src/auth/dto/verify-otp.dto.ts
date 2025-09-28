import { IsOptional, IsPhoneNumber, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @IsPhoneNumber('IN')
  phoneNumber!: string;

  @IsString()
  @Length(4, 8)
  code!: string;

  @IsOptional()
  @IsString()
  requestId?: string;

  @IsOptional()
  @IsString()
  name?: string;
}
