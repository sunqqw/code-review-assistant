import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PullRequestEvent, ReviewReport } from '../types';
import { GithubApiService } from '../github-api/github-api.service';
import { AiReviewService } from '../ai-review/ai-review.service';

@Injectable()
export class GithubWebhookService {
  private readonly logger = new Logger(GithubWebhookService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly githubApiService: GithubApiService,
    private readonly aiReviewService: AiReviewService,
  ) {}

  /**
   * 处理Pull Request事件
   */
  async processPullRequest(event: PullRequestEvent): Promise<void> {
    const { pull_request: pullRequest, repository } = event;
    
    this.logger.log(`Processing PR #${pullRequest.number}: ${pullRequest.title}`);

    try {
      // 解析仓库信息
      const [owner, repo] = repository.full_name.split('/');

      // 获取PR的diff内容
      const diff = await this.githubApiService.getPullRequestDiff(
        owner,
        repo,
        pullRequest.number,
      );

      // 获取PR的文件变更
      const files = await this.githubApiService.getPullRequestFiles(
        owner,
        repo,
        pullRequest.number,
      );

      this.logger.log(`Found ${files.length} files changed in PR #${pullRequest.number}`);

      // 调用AI服务进行代码评审
      const reviewReport = await this.aiReviewService.reviewCode(diff, files);

      // 生成评审评论
      const reviewComment = this.formatReviewComment(reviewReport);

      // 发布评审结果到PR
      await this.githubApiService.createPullRequestComment(
        owner,
        repo,
        pullRequest.number,
        reviewComment,
      );

      this.logger.log(`Successfully reviewed PR #${pullRequest.number}`);
    } catch (error) {
      this.logger.error(`Failed to process PR #${pullRequest.number}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 格式化评审评论
   */
  private formatReviewComment(report: ReviewReport): string {
    let comment = '## 🤖 AI代码评审报告\n\n';
    
    // 添加总体评价
    comment += `### 📊 总体评分: ${report.overallScore}/10\n\n`;
    comment += `${report.summary}\n\n`;

    // 添加正面反馈
    if (report.positiveFeedback.length > 0) {
      comment += '### ✅ 代码亮点\n';
      report.positiveFeedback.forEach(feedback => {
        comment += `- ${feedback}\n`;
      });
      comment += '\n';
    }

    // 添加问题列表
    if (report.issues.length > 0) {
      comment += '### ⚠️ 需要关注的问题\n';
      
      // 按严重程度分组
      const errors = report.issues.filter(issue => issue.severity === 'error');
      const warnings = report.issues.filter(issue => issue.severity === 'warning');
      const infos = report.issues.filter(issue => issue.severity === 'info');

      if (errors.length > 0) {
        comment += '#### 🔴 错误\n';
        errors.forEach(issue => {
          comment += `- **${issue.filePath}:${issue.line}** - ${issue.message}\n`;
          if (issue.suggestion) {
            comment += `  💡 建议: ${issue.suggestion}\n`;
          }
        });
        comment += '\n';
      }

      if (warnings.length > 0) {
        comment += '#### 🟡 警告\n';
        warnings.forEach(issue => {
          comment += `- **${issue.filePath}:${issue.line}** - ${issue.message}\n`;
          if (issue.suggestion) {
            comment += `  💡 建议: ${issue.suggestion}\n`;
          }
        });
        comment += '\n';
      }

      if (infos.length > 0) {
        comment += '#### 🔵 信息\n';
        infos.forEach(issue => {
          comment += `- **${issue.filePath}:${issue.line}** - ${issue.message}\n`;
        });
        comment += '\n';
      }
    } else {
      comment += '### ✅ 未发现明显问题\n\n';
    }

    // 添加页脚
    comment += '---\n';
    comment += '🤖 这是AI自动生成的代码评审报告，请根据实际情况进行调整。\n';
    comment += `⏰ 生成时间: ${new Date().toLocaleString('zh-CN')}\n`;

    return comment;
  }
}