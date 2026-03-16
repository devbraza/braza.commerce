import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum ConversionEventType {
  ViewContent = 'ViewContent',
  AddToCart = 'AddToCart',
  InitiateCheckout = 'InitiateCheckout',
  Purchase = 'Purchase',
}

export class CreateConversationEventDto {
  @IsEnum(ConversionEventType)
  type: ConversionEventType;

  @IsNumber()
  @IsOptional()
  value?: number;

  @IsString()
  @IsOptional()
  currency?: string;
}
