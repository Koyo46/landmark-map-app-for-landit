import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type GoogleGeocodingResponse = {
  status?: string;
  error_message?: string;
  plus_code?: {
    compound_code?: string;
    global_code?: string;
  };
  results?: Array<{
    formatted_address?: string;
    place_id?: string;
    types?: string[];
  }>;
};

type GoogleGeocodingResult = NonNullable<
  GoogleGeocodingResponse['results']
>[number];

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly geocodingEndpoint =
    'https://maps.googleapis.com/maps/api/geocode/json';

  constructor(private readonly configService: ConfigService) {}

  async reverseGeocode(
    lat: number,
    lng: number,
  ): Promise<{
    status: string;
    formattedAddress: string | null;
    placeId: string | null;
    types: string[];
    plusCode: string | null;
  }> {
    const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException(
        'GOOGLE_MAPS_API_KEY is not configured',
      );
    }

    const url = new URL(this.geocodingEndpoint);
    url.searchParams.set('latlng', `${lat},${lng}`);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('language', 'ja');

    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      this.logger.error(
        `Failed to call Google Geocoding API for lat=${lat}, lng=${lng}`,
        error as Error,
      );
      throw new BadGatewayException(
        'Failed to reach Google Geocoding API endpoint',
      );
    }

    if (!response.ok) {
      throw new BadGatewayException(
        `Google Geocoding API returned HTTP ${response.status}`,
      );
    }

    const payloadUnknown: unknown = await response.json();
    const payload =
      typeof payloadUnknown === 'object' && payloadUnknown !== null
        ? (payloadUnknown as GoogleGeocodingResponse)
        : {};

    if (!payload.status || payload.status === 'REQUEST_DENIED') {
      throw new BadGatewayException(
        payload.error_message ??
          'Google Geocoding API denied the reverse geocoding request',
      );
    }

    if (payload.status !== 'OK' && payload.status !== 'ZERO_RESULTS') {
      throw new BadGatewayException(
        `Google Geocoding API returned status ${payload.status}`,
      );
    }

    const results = Array.isArray(payload.results) ? payload.results : [];
    // plus_code は住所ではないので除外
    const validResult = results.find(
      (result: GoogleGeocodingResult) => !result.types?.includes('plus_code'),
    );

    return {
      status: payload.status,
      formattedAddress: validResult?.formatted_address ?? null,
      placeId: validResult?.place_id ?? null,
      types: validResult?.types ?? [],
      plusCode: payload.plus_code?.global_code ?? null,
    };
  }
}
