import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  leadId: string;

  @IsString()
  @IsOptional()
  conversationId?: string;

  @IsString()
  @IsOptional()
  productId?: string;

  @IsNumber()
  value: number;

  @IsString()
  @IsOptional()
  currency?: string;
}
