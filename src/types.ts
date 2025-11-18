export interface PullRequestEvent {
  action: string;
  number: number;
  pull_request: {
    id: number;
    number: number;
    state: string;
    title: string;
    body: string;
    html_url: string;
    diff_url: string;
    patch_url: string;
    head: {
      ref: string;
      sha: string;
      repo: {
        name: string;
        full_name: string;
      };
    };
    base: {
      ref: string;
      sha: string;
      repo: {
        name: string;
        full_name: string;
      };
    };
    user: {
      login: string;
      id: number;
    };
    created_at: string;
    updated_at: string;
  };
  repository: {
    id: number;
    name: string;
    full_name: string;
    owner: {
      login: string;
      id: number;
    };
  };
  sender: {
    login: string;
    id: number;
  };
}

export interface CodeReview {
  filePath: string;
  line: number;
  severity: 'info' | 'warning' | 'error';
  message: string;
  suggestion?: string;
}

export interface ReviewReport {
  summary: string;
  issues: CodeReview[];
  positiveFeedback: string[];
  overallScore: number;
}