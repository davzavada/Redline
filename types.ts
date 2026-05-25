export enum ChangeType {
  UNCHANGED = 'UNCHANGED',
  ADDED = 'ADDED',
  REMOVED = 'REMOVED'
}

export interface Document {
  id: string;
  name: string;
  text: string;
}

export interface DiffSegment {
  id: string;
  text: string;
  type: ChangeType;
}

export interface AnalysisResponse {
  summary: string;
  risks: string[];
  formattingIssues: string[];
}

export enum ViewMode {
  EDIT = 'EDIT', // Now the only mode, effectively
  REDLINE = 'REDLINE'
}
