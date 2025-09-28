import { IsLatitude, IsLongitude, IsOptional, IsString, Length } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @Length(1, 64)
  label!: string;

  @IsString()
  @Length(1, 128)
  line1!: string;

  @IsOptional()
  @IsString()
  @Length(0, 128)
  line2?: string;

  @IsString()
  @Length(1, 64)
  city!: string;

  @IsString()
  @Length(1, 64)
  state!: string;

  @IsString()
  @Length(3, 12)
  postalCode!: string;

  @IsLatitude()
  latitude!: number;

  @IsLongitude()
  longitude!: number;
}
