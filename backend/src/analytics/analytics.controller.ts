import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { AnalyticsService } from "./analytics.service";
import { TrackEventDto } from "./dto/track-event.dto";
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}
  /**
   * Track events (batch endpoint)
   * POST /api/analytics/track
   */
  @Post("track")
  @HttpCode(HttpStatus.OK)
  async trackEvents(
    @Body() trackEventDto: TrackEventDto,
    @Req() request: Request,
  ) {
    const userIp = this.getClientIp(request);
    const userAgent = request.headers["user-agent"];
    try {
      await this.analyticsService.trackEvents(
        trackEventDto.events,
        userIp,
        userAgent,
      );
      return {
        success: true,
        message: "Events tracked successfully",
        count: trackEventDto.events.length,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to track events",
        error: error.message,
      };
    }
  }
  /**
   * Get statistics for an ONG
   * GET /api/analytics/stats?ongId=xxx&days=30
   */
  @Get("stats")
  async getStats(@Query("ongId") ongId: string, @Query("days") days?: string) {
    const daysNumber = days ? parseInt(days, 10) : 30;
    if (!ongId) {
      return {
        success: false,
        message: "ongId is required",
      };
    }
    try {
      const stats = await this.analyticsService.getOngStats(ongId, daysNumber);
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to get stats",
        error: error.message,
      };
    }
  }
  /**
   * Get top pets for an ONG
   * GET /api/analytics/top-pets?ongId=xxx&limit=10
   */
  @Get("top-pets")
  async getTopPets(
    @Query("ongId") ongId: string,
    @Query("limit") limit?: string,
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    if (!ongId) {
      return {
        success: false,
        message: "ongId is required",
      };
    }
    try {
      const topPets = await this.analyticsService.getTopPets(
        ongId,
        limitNumber,
      );
      return {
        success: true,
        data: topPets,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to get top pets",
        error: error.message,
      };
    }
  }
  /**
   * Get views by day
   * GET /api/analytics/views-by-day?ongId=xxx&days=30
   */
  @Get("views-by-day")
  async getViewsByDay(
    @Query("ongId") ongId: string,
    @Query("days") days?: string,
  ) {
    const daysNumber = days ? parseInt(days, 10) : 30;
    if (!ongId) {
      return {
        success: false,
        message: "ongId is required",
      };
    }
    try {
      const viewsByDay = await this.analyticsService.getViewsByDay(
        ongId,
        daysNumber,
      );
      return {
        success: true,
        data: viewsByDay,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to get views by day",
        error: error.message,
      };
    }
  }
  /**
   * Get total events count (admin only)
   * GET /api/analytics/total
   */
  @Get("total")
  async getTotalEvents() {
    try {
      const total = await this.analyticsService.getTotalEvents();
      return {
        success: true,
        total,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to get total events",
        error: error.message,
      };
    }
  }
  /**
   * Extract client IP from request
   */
  private getClientIp(request: Request): string | undefined {
    // Check various headers for the real IP
    const forwarded = request.headers["x-forwarded-for"];
    if (forwarded) {
      const ips = (forwarded as string).split(",");
      return ips[0].trim();
    }
    const realIp = request.headers["x-real-ip"];
    if (realIp) {
      return realIp as string;
    }
    return request.ip;
  }
}
