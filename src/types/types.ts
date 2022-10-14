export interface Issue {
  code: string;
  type: string;
  typeCode: number;
  message: string;
  context: string;
  selector: string;
  runner?: string;
  runnerExtras?: any;
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
  adaScore: number;
  issueMeta: IssueMeta;
}
