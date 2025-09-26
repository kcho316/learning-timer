import Papa from 'papaparse';
import type {
  Session,
  StorageData,
  StorageMetadata,
  ValidationError,
  ImportPreview,
  DataStatistics,
  ExportOptions,
  DuplicateInfo
} from '../types';

const STORAGE_KEY = 'learning-timer-enhanced-data';
const LEGACY_SESSIONS_KEY = 'learning-timer-sessions';
const CURRENT_VERSION = '1.0.0';
const MAX_FILE_SIZE = 1024 * 1024; // 1MB

class EnhancedStorageManager {
  private static instance: EnhancedStorageManager;

  private constructor() {}

  public static getInstance(): EnhancedStorageManager {
    if (!EnhancedStorageManager.instance) {
      EnhancedStorageManager.instance = new EnhancedStorageManager();
    }
    return EnhancedStorageManager.instance;
  }

  // Storage availability check
  private isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  // Generate simple checksum for data integrity
  private generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Generate unique ID
  private generateId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Check for duplicate sessions based on subject and start time
  private findDuplicates(newSessions: Session[], existingSessions: Session[]): DuplicateInfo[] {
    const duplicates: DuplicateInfo[] = [];

    newSessions.forEach(newSession => {
      const duplicate = existingSessions.find(existing =>
        existing.subject.toLowerCase().trim() === newSession.subject.toLowerCase().trim() &&
        Math.abs(existing.startTime.getTime() - newSession.startTime.getTime()) < 60000 // Within 1 minute
      );

      if (duplicate) {
        duplicates.push({
          existingSession: duplicate,
          importedSession: newSession,
          matchReason: 'Same subject and start time (within 1 minute)'
        });
      }
    });

    return duplicates;
  }

  // Validate session object with optional ID
  private validateSession(session: any, rowIndex?: number, allowMissingId: boolean = false): ValidationError[] {
    const errors: ValidationError[] = [];
    const prefix = rowIndex !== undefined ? `Row ${rowIndex}: ` : '';

    // ID is optional for imports, but if provided must be valid
    if (!allowMissingId && (!session.id || typeof session.id !== 'string')) {
      errors.push({
        type: 'error',
        message: `${prefix}Missing or invalid session ID`,
        row: rowIndex,
        column: 'id',
        value: session.id
      });
    } else if (session.id && typeof session.id !== 'string') {
      errors.push({
        type: 'error',
        message: `${prefix}Invalid session ID format`,
        row: rowIndex,
        column: 'id',
        value: session.id
      });
    }

    if (!session.subject || typeof session.subject !== 'string' || session.subject.trim().length === 0) {
      errors.push({
        type: 'error',
        message: `${prefix}Missing or empty subject`,
        row: rowIndex,
        column: 'subject',
        value: session.subject
      });
    }

    if (typeof session.duration !== 'number' || session.duration <= 0) {
      errors.push({
        type: 'error',
        message: `${prefix}Duration must be a positive number`,
        row: rowIndex,
        column: 'duration',
        value: session.duration
      });
    }

    // Validate startTime
    const startTime = new Date(session.startTime);
    if (isNaN(startTime.getTime())) {
      errors.push({
        type: 'error',
        message: `${prefix}Invalid start time format`,
        row: rowIndex,
        column: 'startTime',
        value: session.startTime
      });
    }

    // Validate endTime if present
    if (session.endTime) {
      const endTime = new Date(session.endTime);
      if (isNaN(endTime.getTime())) {
        errors.push({
          type: 'error',
          message: `${prefix}Invalid end time format`,
          row: rowIndex,
          column: 'endTime',
          value: session.endTime
        });
      } else if (startTime.getTime() >= endTime.getTime()) {
        errors.push({
          type: 'warning',
          message: `${prefix}End time should be after start time`,
          row: rowIndex,
          column: 'endTime'
        });
      }
    }

    if (typeof session.completed !== 'boolean') {
      errors.push({
        type: 'error',
        message: `${prefix}Completed field must be true or false`,
        row: rowIndex,
        column: 'completed',
        value: session.completed
      });
    }

    return errors;
  }

  // Migrate legacy data
  private migrateLegacyData(): Session[] {
    try {
      const legacyData = localStorage.getItem(LEGACY_SESSIONS_KEY);
      if (!legacyData) return [];

      const sessions = JSON.parse(legacyData);
      const migratedSessions: Session[] = sessions.map((session: any) => ({
        ...session,
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : undefined,
      }));

      // Validate migrated data
      const allErrors: ValidationError[] = [];
      const validSessions = migratedSessions.filter((session, index) => {
        const errors = this.validateSession(session, index + 1);
        allErrors.push(...errors);
        return errors.filter(e => e.type === 'error').length === 0;
      });

      if (allErrors.length > 0) {
        console.warn('Legacy data migration warnings:', allErrors);
      }

      // Remove legacy data after successful migration
      localStorage.removeItem(LEGACY_SESSIONS_KEY);

      return validSessions;
    } catch (error) {
      console.error('Failed to migrate legacy data:', error);
      return [];
    }
  }

  // Load sessions with validation and migration
  public loadSessions(): Session[] {
    if (!this.isStorageAvailable()) {
      console.warn('localStorage not available, returning empty array');
      return [];
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        // Try to migrate legacy data
        const migratedSessions = this.migrateLegacyData();
        if (migratedSessions.length > 0) {
          this.saveSessions(migratedSessions);
          return migratedSessions;
        }
        return [];
      }

      const data: StorageData = JSON.parse(stored);

      // Validate metadata
      if (!data.metadata || !data.sessions) {
        throw new Error('Invalid storage format');
      }

      // Convert date strings back to Date objects
      const sessions: Session[] = data.sessions.map(session => ({
        ...session,
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : undefined,
      }));

      // Validate data integrity
      const sessionString = JSON.stringify(data.sessions);
      const expectedChecksum = this.generateChecksum(sessionString);

      if (data.metadata.dataChecksum && data.metadata.dataChecksum !== expectedChecksum) {
        console.warn('Data integrity check failed, data may be corrupted');
      }

      // Validate individual sessions
      const validSessions = sessions.filter((session, index) => {
        const errors = this.validateSession(session, index + 1);
        if (errors.filter(e => e.type === 'error').length > 0) {
          console.warn(`Invalid session at index ${index}:`, errors);
          return false;
        }
        return true;
      });

      return validSessions;
    } catch (error) {
      console.error('Failed to load sessions:', error);
      // Try to migrate legacy data as fallback
      return this.migrateLegacyData();
    }
  }

  // Save sessions with metadata and validation
  public saveSessions(sessions: Session[]): void {
    if (!this.isStorageAvailable()) {
      throw new Error('localStorage not available');
    }

    try {
      // Validate all sessions before saving
      const allErrors: ValidationError[] = [];
      sessions.forEach((session, index) => {
        const errors = this.validateSession(session, index + 1);
        allErrors.push(...errors.filter(e => e.type === 'error'));
      });

      if (allErrors.length > 0) {
        throw new Error(`Cannot save invalid sessions: ${allErrors.map(e => e.message).join(', ')}`);
      }

      const sessionString = JSON.stringify(sessions);
      const metadata: StorageMetadata = {
        version: CURRENT_VERSION,
        lastModified: new Date(),
        sessionCount: sessions.length,
        dataChecksum: this.generateChecksum(sessionString)
      };

      const storageData: StorageData = { metadata, sessions };

      // Check storage quota
      const dataSize = JSON.stringify(storageData).length;
      if (dataSize > 5 * 1024 * 1024) { // 5MB warning
        console.warn('Storage data is getting large, consider data cleanup');
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Please export and clear old data.');
      }
      throw error;
    }
  }

  // Add session with validation
  public addSession(session: Session): void {
    const errors = this.validateSession(session);
    if (errors.filter(e => e.type === 'error').length > 0) {
      throw new Error(`Invalid session: ${errors.map(e => e.message).join(', ')}`);
    }

    const sessions = this.loadSessions();
    sessions.push(session);
    this.saveSessions(sessions);
  }

  // Get comprehensive data statistics
  public getDataStatistics(): DataStatistics {
    const sessions = this.loadSessions();
    const completedSessions = sessions.filter(s => s.completed);

    const subjectMap = new Map<string, { count: number; totalTime: number }>();
    let totalStudyTime = 0;
    let oldestSession: Date | undefined;
    let newestSession: Date | undefined;

    sessions.forEach(session => {
      // Track subjects
      const existing = subjectMap.get(session.subject) || { count: 0, totalTime: 0 };
      existing.count++;
      existing.totalTime += session.duration;
      subjectMap.set(session.subject, existing);

      // Track total study time for completed sessions
      if (session.completed) {
        totalStudyTime += session.duration;
      }

      // Track date range
      if (!oldestSession || session.startTime < oldestSession) {
        oldestSession = session.startTime;
      }
      if (!newestSession || session.startTime > newestSession) {
        newestSession = session.startTime;
      }
    });

    const topSubjects = Array.from(subjectMap.entries())
      .map(([subject, stats]) => ({ subject, ...stats }))
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 10);

    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      totalStudyTime,
      oldestSession,
      newestSession,
      topSubjects
    };
  }

  // Export data to various formats
  public exportData(options: ExportOptions): string {
    const sessions = this.loadSessions();
    let filteredSessions = sessions;

    // Apply filters
    if (!options.includeIncomplete) {
      filteredSessions = filteredSessions.filter(s => s.completed);
    }

    if (options.dateRange) {
      filteredSessions = filteredSessions.filter(s =>
        s.startTime >= options.dateRange!.start && s.startTime <= options.dateRange!.end
      );
    }

    if (options.format === 'json') {
      return JSON.stringify({
        metadata: {
          exportDate: new Date().toISOString(),
          version: CURRENT_VERSION,
          totalSessions: filteredSessions.length
        },
        sessions: filteredSessions
      }, null, 2);
    }

    // CSV format
    const csvData = filteredSessions.map(session => ({
      id: session.id,
      subject: session.subject,
      duration: session.duration,
      startTime: session.startTime.toISOString(),
      endTime: session.endTime?.toISOString() || '',
      completed: session.completed
    }));

    return Papa.unparse(csvData, {
      header: true,
      columns: ['id', 'subject', 'duration', 'startTime', 'endTime', 'completed']
    });
  }

  // Validate CSV file before import with smart duplicate detection
  public validateCSVFile(file: File): Promise<ImportPreview> {
    return new Promise((resolve, reject) => {
      // File size check
      if (file.size > MAX_FILE_SIZE) {
        reject(new Error(`File size (${Math.round(file.size / 1024)}KB) exceeds maximum allowed size (${MAX_FILE_SIZE / 1024}KB)`));
        return;
      }

      // File type check
      if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
        reject(new Error('File must be a CSV file (.csv extension)'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csvContent = e.target?.result as string;

          Papa.parse(csvContent, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              const errors: ValidationError[] = [];
              const validSessions: Session[] = [];
              let generatedIds = 0;

              // Required columns check (ID is now optional)
              const requiredColumns = ['subject', 'duration', 'startTime', 'completed'];
              const headers = results.meta.fields || [];

              requiredColumns.forEach(col => {
                if (!headers.includes(col)) {
                  errors.push({
                    type: 'error',
                    message: `Missing required column: ${col}`,
                    column: col
                  });
                }
              });

              // Note: ID column is optional for imports

              if (errors.length === 0) {
                // Track used IDs to prevent duplicates within the import
                const usedIds = new Set<string>();

                // Validate each row
                results.data.forEach((row: any, index: number) => {
                  const rowNumber = index + 2; // +2 because index is 0-based and we have a header

                  try {
                    // Generate ID if not provided
                    let sessionId = row.id?.toString()?.trim();
                    if (!sessionId) {
                      sessionId = this.generateId();
                      generatedIds++;
                    }

                    // Check for duplicate IDs within the import
                    if (usedIds.has(sessionId)) {
                      // Auto-generate a new ID for duplicates
                      sessionId = this.generateId();
                      generatedIds++;
                      errors.push({
                        type: 'warning',
                        message: `Row ${rowNumber}: Duplicate ID found, auto-generated new ID`,
                        row: rowNumber,
                        column: 'id'
                      });
                    }
                    usedIds.add(sessionId);

                    const session: Session = {
                      id: sessionId,
                      subject: row.subject?.toString()?.trim() || '',
                      duration: parseFloat(row.duration) || 0,
                      startTime: new Date(row.startTime),
                      endTime: row.endTime ? new Date(row.endTime) : undefined,
                      completed: row.completed === 'true' || row.completed === true
                    };

                    const validationErrors = this.validateSession(session, rowNumber, true); // Allow missing ID
                    errors.push(...validationErrors);

                    // Only add to valid sessions if no critical errors
                    if (validationErrors.filter(e => e.type === 'error').length === 0) {
                      validSessions.push(session);
                    }
                  } catch (error: any) {
                    errors.push({
                      type: 'error',
                      message: `Row ${rowNumber}: Failed to parse data - ${error}`,
                      row: rowNumber
                    });
                  }
                });
              }

              // Check for duplicates against existing data
              const existingSessions = this.loadSessions();
              const duplicates = this.findDuplicates(validSessions, existingSessions);

              resolve({
                totalRows: results.data.length,
                validRows: validSessions.length,
                errors,
                sampleData: validSessions, // All valid sessions (preview will show subset in UI)
                duplicates,
                generatedIds
              });
            },
            error: (error: any) => {
              reject(new Error(`CSV parsing failed: ${error.message}`));
            }
          });
        } catch (error) {
          reject(new Error(`Failed to read file: ${error}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  // Import validated CSV data with smart duplicate handling
  public importSessions(sessions: Session[], replaceExisting: boolean = false, skipDuplicates: boolean = true): void {
    if (replaceExisting) {
      this.saveSessions(sessions);
    } else {
      const existingSessions = this.loadSessions();

      let newSessions = sessions;

      if (skipDuplicates) {
        // Filter out sessions that would be duplicates based on subject + time
        const duplicates = this.findDuplicates(sessions, existingSessions);
        const duplicateIds = new Set(duplicates.map(d => d.importedSession.id));
        newSessions = sessions.filter(s => !duplicateIds.has(s.id));
      } else {
        // Just check for ID conflicts and rename if needed
        const existingIds = new Set(existingSessions.map(s => s.id));
        newSessions = sessions.map(session => {
          if (existingIds.has(session.id)) {
            return { ...session, id: this.generateId() };
          }
          return session;
        });
      }

      const allSessions = [...existingSessions, ...newSessions];
      this.saveSessions(allSessions);
    }
  }

  // Clear all data with confirmation
  public clearAllData(): void {
    if (!this.isStorageAvailable()) {
      throw new Error('localStorage not available');
    }

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_SESSIONS_KEY);
  }

  // Get storage metadata
  public getStorageMetadata(): StorageMetadata | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const data: StorageData = JSON.parse(stored);
      return {
        ...data.metadata,
        lastModified: new Date(data.metadata.lastModified)
      };
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const enhancedStorage = EnhancedStorageManager.getInstance();

// Export utility functions for backward compatibility
export const saveSessions = (sessions: Session[]) => enhancedStorage.saveSessions(sessions);
export const loadSessions = () => enhancedStorage.loadSessions();
export const addSession = (session: Session) => enhancedStorage.addSession(session);
export const getSessionStats = () => {
  const sessions = loadSessions().filter(s => s.completed);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    daily: sessions.filter(s => s.startTime >= today).length,
    weekly: sessions.filter(s => s.startTime >= weekAgo).length,
    monthly: sessions.filter(s => s.startTime >= monthAgo).length,
  };
};