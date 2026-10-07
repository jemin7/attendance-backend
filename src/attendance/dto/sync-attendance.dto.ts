import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class SyncAttendanceDto {
  @IsString()
  clientEventId: string;

  @IsString()
  @IsIn(['PUNCH_IN', 'PUNCH_OUT'])
  action: 'PUNCH_IN' | 'PUNCH_OUT';

  @IsInt()
  userId: number;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsString()
  punchTime: string;

  @IsOptional()
  @IsString()
  referenceEventId?: string;
}