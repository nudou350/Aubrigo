import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CountryService } from './country.service';
import { Request } from 'express';
@ApiTags('Country')
@Controller('country')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}
  @Get('detect')
  @ApiOperation({ summary: 'Detect user country from request' })
  @ApiResponse({ status: 200, description: 'Returns detected country code' })
  detectCountry(@Req() req: Request) {
    const countryCode = this.countryService.detectCountryFromRequest(req);
    const country = this.countryService.getCountryByCode(countryCode);
    return {
      countryCode,
      country,
    };
  }
  @Get('all')
  @ApiOperation({ summary: 'Get all available countries' })
  @ApiResponse({ status: 200, description: 'Returns list of all countries' })
  getAllCountries() {
    return this.countryService.getAllCountries();
  }
  @Get('search')
  @ApiOperation({ summary: 'Search countries by name or code' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum results', type: Number })
  @ApiResponse({ status: 200, description: 'Returns matching countries' })
  searchCountries(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 5;
    return this.countryService.searchCountries(query, limitNum);
  }
}
