export interface Session {
  id: string;
  subject: string;
  duration: number; // in minutes
  startTime: Date;
  endTime?: Date;
  completed: boolean;
}

export interface SessionStats {
  daily: number;
  weekly: number;
  monthly: number;
}

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

// Enhanced storage types
export interface StorageMetadata {
  version: string;
  lastModified: Date;
  sessionCount: number;
  dataChecksum?: string;
}

export interface StorageData {
  metadata: StorageMetadata;
  sessions: Session[];
}

export interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  row?: number;
  column?: string;
  value?: any;
}

export interface DuplicateInfo {
  existingSession: Session;
  importedSession: Session;
  matchReason: string;
}

export interface ImportPreview {
  totalRows: number;
  validRows: number;
  errors: ValidationError[];
  sampleData: Session[];
  duplicates: DuplicateInfo[];
  generatedIds: number; // Count of auto-generated IDs
}

export interface DataStatistics {
  totalSessions: number;
  completedSessions: number;
  totalStudyTime: number; // in minutes
  oldestSession?: Date;
  newestSession?: Date;
  topSubjects: Array<{ subject: string; count: number; totalTime: number }>;
}

export interface ExportOptions {
  format: 'csv' | 'json';
  includeIncomplete?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}