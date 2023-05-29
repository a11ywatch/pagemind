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

// audit params for making request
export interface ScanRpcParams {
  url: string;
  userId?: number;
  pageHeaders?: any[];
  mobile?: boolean; // is the testing done in mobile view port
  standard?: string; // is the testing done in mobile view port
  ua?: string; // is the testing done in mobile view port
  actions?: string[]; // perform actions before testing
  cv?: boolean; // can use computer vision
  pageSpeedApiKey?: string; // the PageSpeed api key to use for request
  html?: string; // raw HTML to validate
  firefox?: boolean; // experimental todo: work outside local containers
  ignore?: string[]; // ignore list of rules
  hideElements?: string[]; // hide the elements from test
  rules?: string[]; // list of rules
  runners?: string[]; // list of runners axe, htmlcs, a11y.
  selector?: string; // the root element selector.
  warningsEnabled?: boolean; // warnings enabled
}
