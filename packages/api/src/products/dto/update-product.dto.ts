import { IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';

export class UpdateProductDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsNumber()
  @Min(0.01)
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @Matches(/^\+\d{10,15}$/, { message: 'whatsappPhone must be in international format' })
  @IsOptional()
  whatsappPhone?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  messageTemplate?: string;
}
