import { IsOptional, IsString, IsBoolean, IsUrl } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  trackingDomain?: string;

  @IsOptional()
  @IsBoolean()
  autoUtm?: boolean;

  @IsOptional()
  @IsString()
  defaultUtmSource?: string;

  @IsOptional()
  @IsString()
  defaultUtmMedium?: string;

  @IsOptional()
  @IsUrl()
  privacyPolicyUrl?: string;

  @IsOptional()
  shippingData?: Record<string, string>;
}
