export interface Issue {
  code: string;
  type: string;
  typeCode: number;
  message: string;
  context: string;
  selector: string;
  runner: string;
  runnerExtras: any;
  recurrence: number;
}

export interface PageIssues {
  issues?: Issue[];
  documentTitle?: string;
  pageUrl?: string;
}

export interface IssueMeta {
  skipContentIncluded: boolean;
}

export interface IssueData {
  possibleIssuesFixedByCdn: number;
  totalIssues: number;
  issuesFixedByCdn: number;
  errorCount: number;
  warningCount: number;
  noticeCount: number;
  accessScore: number;
  issueMeta: IssueMeta;
}
