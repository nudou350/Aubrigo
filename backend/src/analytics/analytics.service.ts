import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, MoreThan } from "typeorm";
import { AnalyticsEvent } from "./entities/analytics-event.entity";
import { SingleEventDto } from "./dto/track-event.dto";
@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private analyticsEventRepository: Repository<AnalyticsEvent>,
  ) {}
  /**
   * Track a single event
   */
  async trackEvent(
    eventDto: SingleEventDto,
    userIp?: string,
    userAgent?: string,
  ): Promise<AnalyticsEvent> {
    const event = this.analyticsEventRepository.create({
      eventType: eventDto.type,
      eventCategory: eventDto.category,
      petId: eventDto.petId || null,
      ongId: eventDto.ongId || null,
      userSessionId: eventDto.sessionId,
      metadata: eventDto.metadata || {},
      isOfflineEvent: eventDto.offline,
      clientTimestamp: new Date(eventDto.timestamp),
      userIp,
      userAgent,
    });
    return await this.analyticsEventRepository.save(event);
  }
  /**
   * Track multiple events (batch)
   */
  async trackEvents(
    events: SingleEventDto[],
    userIp?: string,
    userAgent?: string,
  ): Promise<AnalyticsEvent[]> {
    const analyticsEvents = events.map((eventDto) =>
      this.analyticsEventRepository.create({
        eventType: eventDto.type,
        eventCategory: eventDto.category,
        petId: eventDto.petId || null,
        ongId: eventDto.ongId || null,
        userSessionId: eventDto.sessionId,
        metadata: eventDto.metadata || {},
        isOfflineEvent: eventDto.offline,
        clientTimestamp: new Date(eventDto.timestamp),
        userIp,
        userAgent,
      }),
    );
    return await this.analyticsEventRepository.save(analyticsEvents);
  }
  /**
   * Get statistics for an ONG
   */
  async getOngStats(ongId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    // Total views
    const petViews = await this.analyticsEventRepository.count({
      where: {
        ongId,
        eventType: "pet_view",
        createdAt: MoreThan(startDate),
      },
    });
    // Total favorites
    const favorites = await this.analyticsEventRepository.count({
      where: {
        ongId,
        eventType: "pet_favorite",
        createdAt: MoreThan(startDate),
      },
    });
    // Total appointments
    const appointments = await this.analyticsEventRepository.count({
      where: {
        ongId,
        eventType: "appointment_create",
        createdAt: MoreThan(startDate),
      },
    });
    // Total shares
    const shares = await this.analyticsEventRepository.count({
      where: {
        ongId,
        eventType: "pet_share",
        createdAt: MoreThan(startDate),
      },
    });
    // Views by day
    const viewsByDay = await this.getViewsByDay(ongId, days);
    // Top pets
    const topPets = await this.getTopPets(ongId, 10);
    // Event breakdown
    const eventBreakdown = await this.getEventBreakdown(ongId, days);
    return {
      summary: {
        petViews,
        favorites,
        appointments,
        shares,
      },
      viewsByDay,
      topPets,
      eventBreakdown,
    };
  }
  /**
   * Get views by day
   */
  async getViewsByDay(ongId: string, days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const result = await this.analyticsEventRepository
      .createQueryBuilder("event")
      .select("DATE(event.created_at)", "date")
      .addSelect("COUNT(*)", "count")
      .where("event.ong_id = :ongId", { ongId })
      .andWhere("event.event_type = :eventType", { eventType: "pet_view" })
      .andWhere("event.created_at > :startDate", { startDate })
      .groupBy("DATE(event.created_at)")
      .orderBy("DATE(event.created_at)", "ASC")
      .getRawMany();
    return result.map((row) => ({
      date: row.date,
      count: parseInt(row.count, 10),
    }));
  }
  /**
   * Get top viewed pets
   */
  async getTopPets(ongId: string, limit: number = 10): Promise<any[]> {
    const result = await this.analyticsEventRepository
      .createQueryBuilder("event")
      .select("event.pet_id", "petId")
      .addSelect("COUNT(*)", "views")
      .leftJoin("event.pet", "pet")
      .addSelect("pet.name", "petName")
      .addSelect("pet.species", "petSpecies")
      .where("event.ong_id = :ongId", { ongId })
      .andWhere("event.event_type = :eventType", { eventType: "pet_view" })
      .andWhere("event.pet_id IS NOT NULL")
      .groupBy("event.pet_id")
      .addGroupBy("pet.name")
      .addGroupBy("pet.species")
      .orderBy("COUNT(*)", "DESC")
      .limit(limit)
      .getRawMany();
    return result.map((row) => ({
      petId: row.petId,
      petName: row.petName,
      petSpecies: row.petSpecies,
      views: parseInt(row.views, 10),
    }));
  }
  /**
   * Get event breakdown by type
   */
  async getEventBreakdown(ongId: string, days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const result = await this.analyticsEventRepository
      .createQueryBuilder("event")
      .select("event.event_type", "eventType")
      .addSelect("COUNT(*)", "count")
      .where("event.ong_id = :ongId", { ongId })
      .andWhere("event.created_at > :startDate", { startDate })
      .groupBy("event.event_type")
      .orderBy("COUNT(*)", "DESC")
      .getRawMany();
    return result.map((row) => ({
      eventType: row.eventType,
      count: parseInt(row.count, 10),
    }));
  }
  /**
   * Get total events count
   */
  async getTotalEvents(): Promise<number> {
    return await this.analyticsEventRepository.count();
  }
  /**
   * Get events count by date range
   */
  async getEventsCountByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return await this.analyticsEventRepository.count({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });
  }
  /**
   * Delete old events (cleanup)
   */
  async deleteOldEvents(days: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const result = await this.analyticsEventRepository
      .createQueryBuilder()
      .delete()
      .where("created_at < :cutoffDate", { cutoffDate })
      .execute();
    return result.affected || 0;
  }
}
