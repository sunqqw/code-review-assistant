import {
  Controller,
  Post,
  Headers,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  Get,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PullRequestEvent } from '../types';
import { GithubWebhookService } from './github-webhook.service';

@Controller('webhook/github')
export class GithubWebhookController {
  private readonly logger = new Logger(GithubWebhookController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly webhookService: GithubWebhookService,
  ) {}

  @Get()
  async healthCheck() {
    return {
      status: 'ok',
      message: 'GitHub Webhook endpoint is working',
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string,
    @Body() payload: any,
  ) {
    this.logger.log(`Received GitHub event: ${event}`);

    // 验证Webhook签名
    if (!this.verifySignature(payload, signature)) {
      this.logger.error('Invalid webhook signature');
      return { error: 'Invalid signature' };
    }

    // 只处理Pull Request事件
    if (event !== 'pull_request') {
      this.logger.log(`Ignoring event: ${event}`);
      return { message: `Event ${event} ignored` };
    }

    const prEvent = payload as PullRequestEvent;

    // 只处理opened和synchronize事件
    if (prEvent.action !== 'opened' && prEvent.action !== 'synchronize') {
      this.logger.log(`Ignoring PR action: ${prEvent.action}`);
      return { message: `PR action ${prEvent.action} ignored` };
    }

    try {
      // 异步处理PR评审，不阻塞Webhook响应
      this.webhookService.processPullRequest(prEvent).catch((error) => {
        this.logger.error(`Failed to process PR: ${error.message}`, error.stack);
      });

      return {
        message: 'Webhook received successfully',
        action: prEvent.action,
        prNumber: prEvent.number,
      };
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`, error.stack);
      return { error: 'Internal server error' };
    }
  }

  /**
   * 验证GitHub Webhook签名
   */
  private verifySignature(payload: any, signature: string): boolean {
    const secret = this.configService.get<string>('GITHUB_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.warn('No webhook secret configured');
      return true; // 如果没有配置密钥，跳过验证
    }

    if (!signature) {
      return false;
    }

    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');
    
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  }
}