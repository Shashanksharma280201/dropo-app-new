import { IsArray, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateCartItemDto {
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
