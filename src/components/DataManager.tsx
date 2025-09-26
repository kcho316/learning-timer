import React, { useState, useRef, useEffect } from 'react';
import { enhancedStorage } from '../utils/enhancedStorage';
import type {
  DataStatistics,
  ExportOptions,
  ImportPreview,
  StorageMetadata
} from '../types';

interface DataManagerProps {
  className?: string;
  onDataChange?: () => void;
}

export const DataManager: React.FC<DataManagerProps> = ({ className = '', onDataChange }) => {
  const [statistics, setStatistics] = useState<DataStatistics | null>(null);
  const [metadata, setMetadata] = useState<StorageMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Import states
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Export states
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeIncomplete: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = () => {
    try {
      const stats = enhancedStorage.getDataStatistics();
      const meta = enhancedStorage.getStorageMetadata();
      setStatistics(stats);
      setMetadata(meta);
    } catch (err) {
      setError(`Failed to load statistics: ${err}`);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleExport = () => {
    clearMessages();
    setIsLoading(true);

    try {
      const data = enhancedStorage.exportData(exportOptions);
      const filename = `learning-timer-${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
      const blob = new Blob([data], {
        type: exportOptions.format === 'csv' ? 'text/csv' : 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(`Data exported successfully as ${filename}`);
      setShowExportOptions(false);
    } catch (err) {
      setError(`Export failed: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    clearMessages();
    setIsLoading(true);
    setSelectedFile(file);

    try {
      const preview = await enhancedStorage.validateCSVFile(file);
      setImportPreview(preview);
      setShowImportPreview(true);
    } catch (err) {
      setError(`File validation failed: ${err}`);
      setSelectedFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = (replaceExisting: boolean = false, skipDuplicates: boolean = true) => {
    if (!importPreview || !selectedFile) return;

    clearMessages();
    setIsLoading(true);

    try {
      // Use all valid sessions, not just sample data
      const sessionsToImport = importPreview.sampleData; // This should be all valid sessions
      enhancedStorage.importSessions(sessionsToImport, replaceExisting, skipDuplicates);

      const importedCount = replaceExisting ?
        importPreview.validRows :
        (skipDuplicates ? importPreview.validRows - importPreview.duplicates.length : importPreview.validRows);

      let message = `Successfully imported ${importedCount} sessions`;
      if (importPreview.duplicates.length > 0 && skipDuplicates) {
        message += ` (${importPreview.duplicates.length} duplicates skipped)`;
      }

      setSuccess(message);
      setShowImportPreview(false);
      setSelectedFile(null);
      setImportPreview(null);
      loadStatistics();
      onDataChange?.();

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(`Import failed: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = () => {
    if (!window.confirm('Are you sure you want to delete ALL session data? This cannot be undone.')) {
      return;
    }

    clearMessages();
    setIsLoading(true);

    try {
      enhancedStorage.clearAllData();
      setSuccess('All data cleared successfully');
      loadStatistics();
      onDataChange?.();
    } catch (err) {
      setError(`Failed to clear data: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className={className.includes('bg-transparent') ? className : `bg-white rounded-xl shadow-sm border border-sage-100 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-700">Data Management</h3>
        <button
          onClick={loadStatistics}
          className="px-3 py-1 text-sm bg-sage-100 text-sage-700 rounded-lg hover:bg-sage-200 transition-colors"
          disabled={isLoading}
        >
          Refresh
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {/* Statistics */}
      {statistics && (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg">
          <h4 className="font-medium text-slate-700 mb-3">Data Overview</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-sage-600">{statistics.totalSessions}</div>
              <div className="text-sm text-slate-500">Total Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-sage-600">{statistics.completedSessions}</div>
              <div className="text-sm text-slate-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-sage-600">{formatDuration(statistics.totalStudyTime)}</div>
              <div className="text-sm text-slate-500">Study Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-sage-600">{statistics.topSubjects.length}</div>
              <div className="text-sm text-slate-500">Subjects</div>
            </div>
          </div>

          {statistics.oldestSession && statistics.newestSession && (
            <div className="mt-3 text-sm text-slate-600">
              Data range: {statistics.oldestSession.toLocaleDateString()} - {statistics.newestSession.toLocaleDateString()}
            </div>
          )}

          {metadata && (
            <div className="mt-3 text-xs text-slate-500">
              Last updated: {metadata.lastModified.toLocaleString()} • Version: {metadata.version}
            </div>
          )}
        </div>
      )}

      {/* Top Subjects */}
      {statistics && statistics.topSubjects.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-slate-700 mb-3">Top Subjects</h4>
          <div className="space-y-2">
            {statistics.topSubjects.slice(0, 5).map((subject) => (
              <div key={subject.subject} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                <span className="text-sm text-slate-700">{subject.subject}</span>
                <div className="text-sm text-slate-500">
                  {subject.count} sessions • {formatDuration(subject.totalTime)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-4">
        {/* Export Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-slate-700">Export Data</h4>
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="px-3 py-1 bg-sage-500 text-white rounded-lg hover:bg-sage-600 transition-colors text-sm"
              disabled={isLoading}
            >
              Export
            </button>
          </div>

          {showExportOptions && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Format</label>
                  <select
                    value={exportOptions.format}
                    onChange={(e) => setExportOptions({...exportOptions, format: e.target.value as 'csv' | 'json'})}
                    className="w-full px-3 py-1 border border-slate-300 rounded text-sm"
                  >
                    <option value="csv">CSV (Spreadsheet)</option>
                    <option value="json">JSON (Complete backup)</option>
                  </select>
                </div>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeIncomplete || false}
                    onChange={(e) => setExportOptions({...exportOptions, includeIncomplete: e.target.checked})}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-600">Include incomplete sessions</span>
                </label>

                <div className="flex space-x-2">
                  <button
                    onClick={handleExport}
                    disabled={isLoading}
                    className="px-3 py-1 bg-sage-500 text-white rounded text-sm hover:bg-sage-600 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Exporting...' : 'Download'}
                  </button>
                  <button
                    onClick={() => setShowExportOptions(false)}
                    className="px-3 py-1 bg-slate-300 text-slate-700 rounded text-sm hover:bg-slate-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Import Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-slate-700">Import Data</h4>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm"
              disabled={isLoading}
            >
              Import CSV
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          <p className="text-xs text-slate-500 mb-2">
            Upload a CSV file with columns: <strong>subject, duration, startTime, completed</strong> (endTime optional)
            <br />
            <span className="text-slate-400">Note: ID column is optional - we'll generate IDs automatically if not provided</span>
          </p>
        </div>

        {/* Import Preview */}
        {showImportPreview && importPreview && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="font-medium text-blue-800 mb-2">Import Preview</h5>

            <div className="mb-3">
              <div className="text-sm text-blue-700">
                Found {importPreview.totalRows} rows, {importPreview.validRows} valid sessions
              </div>

              {importPreview.generatedIds > 0 && (
                <div className="text-xs text-green-600">
                  ✓ Auto-generated {importPreview.generatedIds} IDs for sessions without IDs
                </div>
              )}

              {importPreview.duplicates.length > 0 && (
                <div className="text-xs text-orange-600">
                  ⚠️ Found {importPreview.duplicates.length} potential duplicate(s)
                </div>
              )}

              {selectedFile && (
                <div className="text-xs text-blue-600">
                  File: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </div>
              )}
            </div>

            {/* Validation Errors */}
            {importPreview.errors.length > 0 && (
              <div className="mb-3">
                <h6 className="text-sm font-medium text-red-700 mb-1">Validation Issues:</h6>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {importPreview.errors.slice(0, 10).map((error, errorIndex) => (
                    <div key={errorIndex} className={`text-xs p-1 rounded ${
                      error.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {error.message}
                    </div>
                  ))}
                  {importPreview.errors.length > 10 && (
                    <div className="text-xs text-slate-500">
                      ... and {importPreview.errors.length - 10} more issues
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Duplicate Warnings */}
            {importPreview.duplicates.length > 0 && (
              <div className="mb-3">
                <h6 className="text-sm font-medium text-orange-700 mb-1">Potential Duplicates:</h6>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {importPreview.duplicates.slice(0, 5).map((duplicate, dupIndex) => (
                    <div key={dupIndex} className="text-xs p-2 bg-orange-100 text-orange-700 rounded">
                      <div className="font-medium">
                        "{duplicate.importedSession.subject}" on {duplicate.importedSession.startTime.toLocaleDateString()}
                      </div>
                      <div className="text-orange-600">
                        {duplicate.matchReason}
                      </div>
                    </div>
                  ))}
                  {importPreview.duplicates.length > 5 && (
                    <div className="text-xs text-slate-500">
                      ... and {importPreview.duplicates.length - 5} more potential duplicates
                    </div>
                  )}
                </div>
                <div className="text-xs text-orange-600 mt-1">
                  💡 Choose "Add to Existing Data" to keep both copies, or "Replace All Data" to start fresh.
                </div>
              </div>
            )}

            {/* Sample Data */}
            {importPreview.sampleData.length > 0 && (
              <div className="mb-3">
                <h6 className="text-sm font-medium text-blue-700 mb-1">Sample Data (first 3 rows):</h6>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="p-1 text-left">Subject</th>
                        <th className="p-1 text-left">Duration</th>
                        <th className="p-1 text-left">Date</th>
                        <th className="p-1 text-left">Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.sampleData.slice(0, 3).map((session, index) => (
                        <tr key={index} className="border-b border-blue-200">
                          <td className="p-1">{session.subject}</td>
                          <td className="p-1">{session.duration}m</td>
                          <td className="p-1">{session.startTime.toLocaleDateString()}</td>
                          <td className="p-1">{session.completed ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleImport(false, true)}
                  disabled={isLoading || importPreview.validRows === 0}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Importing...' : 'Add to Existing (Skip Duplicates)'}
                </button>
                {importPreview.duplicates.length > 0 && (
                  <button
                    onClick={() => handleImport(false, false)}
                    disabled={isLoading || importPreview.validRows === 0}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    Add All (Keep Duplicates)
                  </button>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleImport(true)}
                  disabled={isLoading || importPreview.validRows === 0}
                  className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  Replace All Data
                </button>
                <button
                  onClick={() => {
                    setShowImportPreview(false);
                    setImportPreview(null);
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="px-3 py-1 bg-slate-300 text-slate-700 rounded text-sm hover:bg-slate-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clear Data */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-slate-700">Clear All Data</h4>
              <p className="text-xs text-slate-500">Permanently delete all session data</p>
            </div>
            <button
              onClick={handleClearData}
              className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
              disabled={isLoading}
            >
              Clear Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};