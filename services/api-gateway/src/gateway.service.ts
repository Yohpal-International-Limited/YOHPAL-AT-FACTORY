import { Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import {
  CreateFeedEventRequest,
  CreateTrendRequest,
  CreateVideoJobRequest,
  GenerateScriptRequest,
  ModerateVideoRequest,
  RenderVideoRequest,
} from '../../../contracts/api-contracts';

@Injectable()
export class GatewayService {
  private readonly trendServiceUrl =
    process.env.TREND_SERVICE_URL || 'http://localhost:3001';
  private readonly scriptServiceUrl =
    process.env.SCRIPT_SERVICE_URL || 'http://localhost:3002';
  private readonly renderServiceUrl =
    process.env.RENDER_SERVICE_URL || 'http://localhost:3003';
  private readonly moderationServiceUrl =
    process.env.MODERATION_SERVICE_URL || 'http://localhost:3004';
  private readonly recommendationServiceUrl =
    process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:3005';

  async health() {
    return {
      service: 'yohpal-live-api-gateway',
      status: 'ok',
      services: {
        trend: this.trendServiceUrl,
        script: this.scriptServiceUrl,
        render: this.renderServiceUrl,
        moderation: this.moderationServiceUrl,
        recommendation: this.recommendationServiceUrl,
      },
    };
  }

  // TREND
  async createTrend(body: CreateTrendRequest) {
    return this.post(`${this.trendServiceUrl}/trends`, body);
  }

  async discoverSeedTrends() {
    return this.post(`${this.trendServiceUrl}/trends/discover-seed`, {});
  }

  async listTrends(query: Record<string, string | number | undefined>) {
    return this.get(`${this.trendServiceUrl}/trends`, query);
  }

  // SCRIPT
  async generateScript(body: GenerateScriptRequest) {
    return this.post(`${this.scriptServiceUrl}/scripts/generate`, body);
  }

  async generatePendingScripts(take?: number) {
    return this.post(`${this.scriptServiceUrl}/scripts/generate-pending`, {}, { params: { take } });
  }

  async listScripts(query: Record<string, string | number | undefined>) {
    return this.get(`${this.scriptServiceUrl}/scripts`, query);
  }

  // RENDER
  async createVideoJob(body: CreateVideoJobRequest) {
    return this.post(`${this.renderServiceUrl}/render/jobs`, body);
  }

  async createPendingVideoJobs(take?: number) {
    return this.post(`${this.renderServiceUrl}/render/jobs/create-pending`, {}, { params: { take } });
  }

  async renderVideo(body: RenderVideoRequest) {
    return this.post(`${this.renderServiceUrl}/render/videos/render`, body);
  }

  async renderPendingVideos(take?: number) {
    return this.post(`${this.renderServiceUrl}/render/videos/render-pending`, {}, { params: { take } });
  }

  async listVideos(query: Record<string, string | number | undefined>) {
    return this.get(`${this.renderServiceUrl}/render/videos`, query);
  }

  // MODERATION
  async moderateVideo(body: ModerateVideoRequest) {
    return this.post(`${this.moderationServiceUrl}/moderation/videos/moderate`, body);
  }

  async moderatePendingVideos(take?: number) {
    return this.post(`${this.moderationServiceUrl}/moderation/videos/moderate-pending`, {}, { params: { take } });
  }

  async manualApprove(videoId: string) {
    return this.post(`${this.moderationServiceUrl}/moderation/videos/${videoId}/approve`, {});
  }

  async manualReject(videoId: string) {
    return this.post(`${this.moderationServiceUrl}/moderation/videos/${videoId}/reject`, {});
  }

  async publishApproved(videoId: string) {
    return this.post(`${this.moderationServiceUrl}/moderation/videos/${videoId}/publish`, {});
  }

  async publishAllApproved(take?: number) {
    return this.post(`${this.moderationServiceUrl}/moderation/videos/publish-approved`, {}, { params: { take } });
  }

  async listModerationQueue(query: Record<string, string | number | undefined>) {
    return this.get(`${this.moderationServiceUrl}/moderation/queue`, query);
  }

  // RECOMMENDATION
  async getSeedFeed(query: Record<string, string | number | undefined>) {
    return this.get(`${this.recommendationServiceUrl}/feed/seed`, query);
  }

  async createFeedEvent(body: CreateFeedEventRequest) {
    return this.post(`${this.recommendationServiceUrl}/feed/events`, body);
  }

  // FULL PIPELINE (One command to rule them all!)
  async runSeedPipeline(take = 10) {
    const trends = await this.discoverSeedTrends();
    const scripts = await this.generatePendingScripts(take);
    const jobs = await this.createPendingVideoJobs(take);
    const renders = await this.renderPendingVideos(take);
    const moderation = await this.moderatePendingVideos(take);
    const published = await this.publishAllApproved(take);

    return {
      message: 'Seed pipeline completed',
      steps: { trends, scripts, jobs, renders, moderation, published },
    };
  }

  async listProviderJobs(query: Record<string, string | number | undefined>) {
    return this.get(`${this.moderationServiceUrl}/provider-jobs`, query);
  }

  async providerJobsSummary() {
    return this.get(`${this.moderationServiceUrl}/provider-jobs/summary`);
  }

  async listScriptProviderLogs(query: Record<string, string | number | undefined>) {
    return this.get(`${this.moderationServiceUrl}/script-provider-logs`, query);
  }

  async scriptProviderLogsSummary() {
    return this.get(`${this.moderationServiceUrl}/script-provider-logs/summary`);
  }

  private async get(url: string, params?: Record<string, unknown>) {
    const response = await axios.get(url, { params });
    return response.data;
  }

  private async post(url: string, body: unknown, config?: AxiosRequestConfig) {
    const response = await axios.post(url, body, config);
    return response.data;
  }
}
