import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Database, FileText, CheckCircle, Clock, XCircle, RefreshCw, AlertTriangle, Loader } from 'lucide-react';

interface UploadJob {
  id: string;
  upload_type: string;
  file_name: string;
  file_size_bytes: number | null;
  status: string;
  total_records: number;
  processed_records: number;
  success_count: number;
  error_count: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string | null;
}

interface UploadJobsResponse {
  items: UploadJob[];
  total: number;
  page: number;
  page_size: number;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusBadge(status: string): { label: string; color: string; icon: React.ReactNode } {
  switch (status) {
    case 'completed':
      return { label: 'Processed', color: 'bg-green-500/10 text-green-500', icon: <CheckCircle size={12} /> };
    case 'running':
      return { label: 'Processing', color: 'bg-blue-500/10 text-blue-400', icon: <Loader size={12} className="animate-spin" /> };
    case 'pending':
      return { label: 'Queued', color: 'bg-yellow-500/10 text-yellow-400', icon: <Clock size={12} /> };
    case 'failed':
      return { label: 'Failed', color: 'bg-red-600/10 text-red-500', icon: <XCircle size={12} /> };
    default:
      return { label: status, color: 'bg-gray-500/10 text-gray-400', icon: <Clock size={12} /> };
  }
}

export function DataUpload() {
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/admin/upload-jobs?page=1&page_size=20', {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch upload jobs: ${response.status}`);
      }
      const data = (await response.json()) as UploadJobsResponse;
      setJobs(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load upload history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  const completedCount = jobs.filter((j) => j.status === 'completed').length;
  const failedCount = jobs.filter((j) => j.status === 'failed').length;
  const totalRecords = jobs.reduce((sum, j) => sum + j.total_records, 0);

  return <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold uppercase tracking-tight text-white mb-2">
            Data Ingestion
          </h2>
          <p className="text-sm font-semibold text-gray-400">
            PIPELINE STATUS: {jobs.some((j) => j.status === 'running') ? 'ACTIVE' : 'IDLE'} • {total} JOBS • STORAGE: POSTGRESQL
          </p>
        </div>
        <button
          onClick={() => void fetchJobs()}
          className="px-4 py-3 bg-gray-800 border border-gray-700 text-gray-300 font-bold uppercase text-sm hover:bg-gray-700 flex items-center gap-2 rounded transition-colors"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 border-l-4 border-l-blue-400 p-4 rounded-lg">
          <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Total Jobs</div>
          <div className="text-xl font-bold text-white">{total}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 border-l-4 border-l-green-400 p-4 rounded-lg">
          <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Completed</div>
          <div className="text-xl font-bold text-green-400">{completedCount}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 border-l-4 border-l-red-400 p-4 rounded-lg">
          <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Failed</div>
          <div className="text-xl font-bold text-red-400">{failedCount}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 border-l-4 border-l-purple-400 p-4 rounded-lg">
          <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Total Records</div>
          <div className="text-xl font-bold text-purple-400">{totalRecords.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Zone */}
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
          <h3 className="text-sm font-bold uppercase text-blue-400 mb-6 flex items-center gap-2">
            <Database size={18} /> Dataset Upload
          </h3>
          <div className="border-2 border-gray-700 border-dashed h-48 flex flex-col items-center justify-center bg-gray-900 hover:bg-gray-900/50 hover:border-blue-400 cursor-pointer transition-colors group rounded">
            <Upload size={32} className="mb-2 text-gray-500 group-hover:text-blue-400" />
            <span className="font-bold uppercase text-gray-500 text-sm group-hover:text-white">
              Drag & Drop CSV/GeoJSON
            </span>
            <span className="text-xs text-gray-600 mt-1">
              Supports: districts, shelters, weather, flood history
            </span>
          </div>
        </div>

        {/* Model Registry */}
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
          <h3 className="text-sm font-bold uppercase text-gray-400 mb-6 flex items-center gap-2">
            <Database size={18} /> Model Registry
          </h3>
          <div className="space-y-4">
            <div className="p-6 bg-blue-400/5 border border-blue-400/30 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="font-black uppercase text-lg text-white">
                  FloodNet v2.1
                </span>
                <span className="bg-green-500 text-black text-[10px] font-black px-3 py-1.5 uppercase rounded">
                  Active
                </span>
              </div>
              <p className="text-xs text-gray-400 font-semibold">
                Last updated: 2 days ago
              </p>
              <p className="text-xs text-blue-400 font-semibold">
                Accuracy: 94.2%
              </p>
            </div>

            <div className="p-6 bg-gray-900 border border-gray-700 opacity-60 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="font-black uppercase text-lg text-gray-500">
                  FloodNet v2.0
                </span>
                <span className="bg-gray-700 text-gray-300 text-[10px] font-black px-3 py-1.5 uppercase rounded">
                  Archived
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload History Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg">
        <div className="p-6 border-b border-gray-700 bg-gray-900 flex justify-between items-center rounded-t-lg">
          <h3 className="text-sm font-bold uppercase text-blue-400 flex items-center gap-2">
            <FileText size={18} /> Upload History
          </h3>
          <span className="text-xs text-gray-500">{total} total jobs</span>
        </div>

        {loading && jobs.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-500">
            <RefreshCw size={24} className="animate-spin mr-2" />
            <span className="text-sm font-semibold uppercase">Loading upload history…</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-40 text-red-400 gap-2">
            <AlertTriangle size={32} />
            <span className="text-sm font-semibold">{error}</span>
            <button
              onClick={() => void fetchJobs()}
              className="mt-2 px-4 py-2 bg-gray-700 text-white text-xs font-bold uppercase rounded hover:bg-gray-600"
            >
              Retry
            </button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <Database size={32} className="mb-2 opacity-50" />
            <span className="text-sm font-semibold uppercase">No upload jobs yet</span>
            <span className="text-xs text-gray-600 mt-1">Upload a dataset to see it here</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-950 text-gray-500 text-[10px] uppercase font-bold">
                <tr>
                  <th className="p-4 border-b border-gray-700">File</th>
                  <th className="p-4 border-b border-gray-700">Type</th>
                  <th className="p-4 border-b border-gray-700">Size</th>
                  <th className="p-4 border-b border-gray-700">Records</th>
                  <th className="p-4 border-b border-gray-700">Status</th>
                  <th className="p-4 border-b border-gray-700">Date</th>
                </tr>
              </thead>
              <tbody className="text-sm font-semibold text-gray-300">
                {jobs.map((job) => {
                  const badge = getStatusBadge(job.status);
                  return (
                    <tr key={job.id} className="hover:bg-gray-900 border-b border-gray-700/50">
                      <td className="p-4 font-bold text-white">{job.file_name}</td>
                      <td className="p-4 text-gray-400 uppercase text-xs">{job.upload_type}</td>
                      <td className="p-4 text-gray-500">{formatFileSize(job.file_size_bytes)}</td>
                      <td className="p-4">
                        <span className="text-white">{job.success_count}</span>
                        {job.error_count > 0 && (
                          <span className="text-red-400 ml-1">/ {job.error_count} err</span>
                        )}
                        <span className="text-gray-600 ml-1">/ {job.total_records}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded flex items-center gap-1 w-fit ${badge.color}`}>
                          {badge.icon} {badge.label}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 text-xs">
                        {job.created_at
                          ? new Date(job.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            })
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>;
}