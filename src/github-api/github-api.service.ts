import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';

@Injectable()
export class GithubApiService {
  private octokit: Octokit;

  constructor(private configService: ConfigService) {
    this.octokit = new Octokit({
      auth: this.configService.get<string>('GITHUB_TOKEN'),
    });
  }

  /**
   * 获取Pull Request的详细信息
   */
  async getPullRequest(owner: string, repo: string, pullNumber: number) {
    const { data } = await this.octokit.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
    });
    return data;
  }

  /**
   * 获取Pull Request的diff内容
   */
  async getPullRequestDiff(owner: string, repo: string, pullNumber: number) {
    const { data } = await this.octokit.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
      mediaType: {
        format: 'diff',
      },
    });
    return data as unknown as string;
  }

  /**
   * 获取Pull Request的文件变更
   */
  async getPullRequestFiles(owner: string, repo: string, pullNumber: number) {
    const { data } = await this.octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber,
    });
    return data;
  }

  /**
   * 在Pull Request中添加评论
   */
  async createPullRequestComment(
    owner: string,
    repo: string,
    pullNumber: number,
    body: string,
  ) {
    const { data } = await this.octokit.issues.createComment({
      owner,
      repo,
      issue_number: pullNumber,
      body,
    });
    return data;
  }

  /**
   * 在Pull Request中添加行级评论
   */
  async createPullRequestReviewComment(
    owner: string,
    repo: string,
    pullNumber: number,
    commitId: string,
    path: string,
    line: number,
    body: string,
  ) {
    const { data } = await this.octokit.pulls.createReviewComment({
      owner,
      repo,
      pull_number: pullNumber,
      commit_id: commitId,
      path,
      line,
      body,
    });
    return data;
  }

  /**
   * 获取仓库信息
   */
  async getRepository(owner: string, repo: string) {
    const { data } = await this.octokit.repos.get({
      owner,
      repo,
    });
    return data;
  }
}