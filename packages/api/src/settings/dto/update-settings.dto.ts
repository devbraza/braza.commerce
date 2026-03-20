import { IsOptional, IsString } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  yampiSecretKey?: string;

  @IsOptional()
  @IsString()
  defaultPixelId?: string;

  @IsOptional()
  @IsString()
  defaultAccessToken?: string;
}
