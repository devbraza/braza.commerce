import { IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0.01)
  price: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @Matches(/^\+\d{10,15}$/, { message: 'whatsappPhone must be in international format (e.g., +5511999999999)' })
  whatsappPhone: string;

  @IsString()
  @IsNotEmpty()
  messageTemplate: string;
}
