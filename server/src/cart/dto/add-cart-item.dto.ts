import { IsArray, IsInt, IsOptional, IsPositive, IsString, Length } from 'class-validator';

export class AddCartItemDto {
  @IsString()
  @Length(1, 128)
  productSlug!: string;

  @IsString()
  @Length(1, 64)
  variantId!: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  quantity?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  addonOptionIds?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}
