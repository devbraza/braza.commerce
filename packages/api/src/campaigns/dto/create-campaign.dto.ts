import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  adAccountId: string;

  @IsString()
  @IsOptional()
  pixelId?: string;

  @IsString()
  @IsOptional()
  adsetName?: string;

  @IsString()
  @IsOptional()
  adName?: string;

  @IsString()
  @IsOptional()
  creativeName?: string;
}
