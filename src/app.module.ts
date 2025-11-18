import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GithubWebhookController } from './github-webhook/github-webhook.controller';
import { GithubWebhookService } from './github-webhook/github-webhook.service';
import { AiReviewService } from './ai-review/ai-review.service';
import { GithubApiService } from './github-api/github-api.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [GithubWebhookController],
  providers: [GithubWebhookService, AiReviewService, GithubApiService],
})
export class AppModule {}