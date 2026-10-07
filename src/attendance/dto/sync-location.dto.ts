import { IsInt, IsLatitude, IsLongitude, IsString } from 'class-validator';

export class SyncLocationDto {
  @IsString()
  clientLocationId: string;

  @IsString()
  sessionEventId: string;

  @IsInt()
  userId: number;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsString()
  capturedAt: string;
}
