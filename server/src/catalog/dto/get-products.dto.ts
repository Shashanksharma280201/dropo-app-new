import { IsInt, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';

export class GetProductsDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Min(1)
  @Max(200)
  limit?: number;
}
