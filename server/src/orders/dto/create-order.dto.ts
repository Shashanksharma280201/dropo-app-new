import { IsOptional, IsString, Length } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @Length(1, 64)
  addressId!: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
