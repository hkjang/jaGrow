import { Controller, Post, Body, Req, Headers } from '@nestjs/common';
import { Request } from 'express';
import { AdAttributionService } from '../services/ad-attribution.service';

@Controller('attribution')
export class AdAttributionController {
  constructor(private readonly attributionService: AdAttributionService) {}

  @Post('event')
  async trackEvent(
    @Body() body: any, 
    @Req() req: any, 
    @Headers('user-agent') userAgent: string
  ) {
    // Extract IP, user agent, cookies if needed
    const ip = req.headers['x-forwarded-for'] || req.ip;
    
    return this.attributionService.processEvent({
      ...body,
      ip,
      userAgent
    });
  }
}
