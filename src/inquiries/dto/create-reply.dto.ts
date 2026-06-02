// src/inquiries/dto/create-reply.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateReplyDto {
  @IsNotEmpty({ message: 'La respuesta no puede estar vacía.' })
  @IsString()
  text: string;
}
