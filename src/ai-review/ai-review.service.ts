import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ReviewReport, CodeReview } from '../types';

interface PullRequestFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

@Injectable()
export class AiReviewService {
  private readonly logger = new Logger(AiReviewService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * 使用AI服务评审代码
   */
  async reviewCode(diff: string, files: PullRequestFile[]): Promise<ReviewReport> {
    try {
      this.logger.log(`Starting AI review for ${files.length} files`);

      // 构建AI请求内容
      const prompt = this.buildReviewPrompt(diff, files);
      
      // 调用AI服务
      const aiResponse = await this.callAiService(prompt);
      
      // 解析AI响应
      const reviewReport = this.parseAiResponse(aiResponse);
      
      this.logger.log(`AI review completed with ${reviewReport.issues.length} issues found`);
      
      return reviewReport;
    } catch (error) {
      this.logger.error(`AI review failed: ${error.message}`, error.stack);
      
      // 返回默认的评审报告
      return this.getDefaultReviewReport();
    }
  }

  /**
   * 构建AI评审提示
   */
  private buildReviewPrompt(diff: string, files: PullRequestFile[]): string {
    const fileSummary = files.map(file => 
      `- ${file.filename} (${file.status}): +${file.additions} -${file.deletions}`
    ).join('\n');

    return `你是一位经验丰富的代码审查专家，请仔细审查以下代码变更并提供详细的评审报告。

## 文件变更摘要
${fileSummary}

## 代码差异
\`\`\`diff
${diff}
\`\`\`

请按照以下格式提供评审报告：

1. **总体评价** (1-2句话总结代码质量)
2. **代码亮点** (列出2-3个做得好的地方)
3. **问题列表** (按严重程度分类：错误、警告、信息)
   - 每个问题包含：文件路径、行号、严重程度、问题描述、改进建议
4. **总体评分** (1-10分，10分为最佳)

请重点关注：
- 代码质量和可读性
- 潜在的bug和安全问题
- 性能优化机会
- 代码规范和最佳实践
- 注释和文档完整性

请提供具体、有建设性的反馈。`;
  }

  /**
   * 调用AI服务
   */
  private async callAiService(prompt: string): Promise<string> {
    const apiKey = this.configService.get<string>('AI_API_KEY');
    const apiUrl = this.configService.get<string>('AI_API_URL');

    if (!apiKey || !apiUrl) {
      throw new Error('AI API configuration missing');
    }

    const response = await axios.post(
      apiUrl,
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的代码审查专家，具有丰富的软件开发经验。请提供详细、准确、有建设性的代码评审意见。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content;
  }

  /**
   * 解析AI响应
   */
  private parseAiResponse(response: string): ReviewReport {
    // 这里实现简单的解析逻辑，实际项目中可能需要更复杂的解析
    const issues: CodeReview[] = [];
    const positiveFeedback: string[] = [];
    let summary = '';
    let overallScore = 7;

    try {
      // 提取总体评价
      const summaryMatch = response.match(/\*\*总体评价\*\*[:：]\s*([^\n]+)/);
      if (summaryMatch) {
        summary = summaryMatch[1].trim();
      }

      // 提取代码亮点
      const positiveSection = response.match(/\*\*代码亮点\*\*([^*]+)/);
      if (positiveSection) {
        const matches = positiveSection[1].match(/^\s*[-•*]\s*([^\n]+)/gm);
        if (matches) {
          positiveFeedback.push(...matches.map(m => m.replace(/^\s*[-•*]\s*/, '').trim()));
        }
      }

      // 提取问题（简化版本）
      const lines = response.split('\n');
      let currentFile = '';
      
      for (const line of lines) {
        // 检测文件路径
        if (line.includes('.') && (line.includes('.js') || line.includes('.ts') || line.includes('.py') || line.includes('.java'))) {
          currentFile = line.trim();
        }
        
        // 检测问题描述
        if (line.includes('错误') || line.includes('warning') || line.includes('问题')) {
          const severity: 'error' | 'warning' | 'info' = line.includes('错误') ? 'error' : 
                                                    line.includes('warning') ? 'warning' : 'info';
          
          issues.push({
            filePath: currentFile || 'unknown',
            line: 1,
            severity,
            message: line.trim(),
          });
        }
      }

      // 提取评分
      const scoreMatch = response.match(/(\d+)\s*分/) || response.match(/(\d+)\s*\/\s*10/);
      if (scoreMatch) {
        overallScore = parseInt(scoreMatch[1]);
      }

    } catch (error) {
      this.logger.error(`Failed to parse AI response: ${error.message}`);
    }

    return {
      summary: summary || 'AI代码评审完成',
      issues,
      positiveFeedback,
      overallScore,
    };
  }

  /**
   * 获取默认的评审报告（当AI服务失败时）
   */
  private getDefaultReviewReport(): ReviewReport {
    return {
      summary: 'AI服务暂时不可用，请稍后重试或手动进行代码审查。',
      issues: [],
      positiveFeedback: [],
      overallScore: 0,
    };
  }
}