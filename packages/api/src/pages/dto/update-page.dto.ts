import { IsOptional, IsString, IsNumber, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePageDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  originalPrice?: number;

  @IsOptional()
  @IsString()
  checkoutUrl?: string;

  @IsOptional()
  @IsString()
  pixelId?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsObject()
  userEditedContent?: Record<string, unknown>;
}
