import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAttendanceDto {
  @IsInt()
  userId: number;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}