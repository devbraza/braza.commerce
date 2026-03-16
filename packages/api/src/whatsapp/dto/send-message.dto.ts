import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  @IsIn(['text', 'image', 'audio', 'document'])
  type?: string; // default: 'text'

  @IsOptional()
  @IsString()
  mediaUrl?: string; // URL of uploaded media file

  @IsOptional()
  @IsString()
  fileName?: string; // original filename for documents
}
