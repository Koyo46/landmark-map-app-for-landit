import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';

@Controller('geocoding')
export class GeocodingController {
  constructor(private readonly geocodingService: GeocodingService) {}

  @Get('reverse-geocode')
  reverseGeocode(@Query('lat') latQuery: string, @Query('lng') lngQuery: string) {
    const lat = Number(latQuery);
    const lng = Number(lngQuery);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      throw new BadRequestException(
        'lat and lng query parameters must be valid numbers',
      );
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new BadRequestException('lat/lng are out of valid coordinate range');
    }

    return this.geocodingService.reverseGeocode(lat, lng);
  }
}
