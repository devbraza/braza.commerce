import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  leadId: string;

  @IsString()
  @IsOptional()
  conversationId?: string;

  @IsEnum(['ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase'])
  type: string;

  @IsNumber()
  @IsOptional()
  value?: number;

  @IsString()
  @IsOptional()
  currency?: string;
}
