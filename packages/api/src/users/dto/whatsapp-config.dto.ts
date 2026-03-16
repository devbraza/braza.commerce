import { IsNotEmpty, IsString } from 'class-validator';

export class WhatsAppConfigDto {
  @IsString()
  @IsNotEmpty()
  instanceId: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  clientToken: string;
}
