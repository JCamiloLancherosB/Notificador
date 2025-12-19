import { useState, useEffect } from 'react';
import { getNotificationHistory } from '../services/api';
import type { NotificationJob, NotificationChannel, NotificationStatus } from '../types';
import { format } from 'date-fns';

export default function History() {
  const [history, setHistory] = useState<NotificationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    channel: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.channel) params.channel = filters.channel;
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      
      const data = await getNotificationHistory(params);
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleApplyFilters = () => {
    loadHistory();
  };

  const handleResetFilters = () => {
    setFilters({
      channel: '',
      status: '',
      startDate: '',
      endDate: '',
    });
    setTimeout(() => loadHistory(), 100);
  };

  const getStatusBadge = (status: NotificationStatus) => {
    const badgeClass = 
      status === 'delivered' ? 'badge-success' :
      status === 'failed' ? 'badge-danger' :
      status === 'sent' ? 'badge-success' :
      status === 'pending' || status === 'queued' ? 'badge-warning' :
      'badge-secondary';
    
    return <span className={`badge ${badgeClass}`}>{status}</span>;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  return (
    <div>
      <div className="card-header">
        <h1 className="card-title">Notification History</h1>
        <button onClick={loadHistory} className="btn btn-outline btn-small">
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <h2 className="card-title">Filters</h2>
        <div className="filters">
          <div className="filter-item">
            <label className="form-label">Channel</label>
            <select
              className="form-select"
              value={filters.channel}
              onChange={(e) => handleFilterChange('channel', e.target.value)}
            >
              <option value="">All Channels</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
          <div className="filter-item">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="queued">Queued</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="filter-item">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-input"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          <div className="filter-item">
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-input"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleApplyFilters} className="btn btn-primary btn-small">
            Apply Filters
          </button>
          <button onClick={handleResetFilters} className="btn btn-outline btn-small">
            Reset
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="card">
        <h2 className="card-title">Results ({history.length})</h2>
        
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p>No notifications found</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Channel</th>
                  <th>Recipient</th>
                  <th>Template</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Sent</th>
                </tr>
              </thead>
              <tbody>
                {history.map(job => (
                  <tr key={job.id}>
                    <td style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                      {job.id.substring(0, 12)}...
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ textTransform: 'uppercase' }}>
                        {job.channel}
                      </span>
                    </td>
                    <td>{job.recipientContact}</td>
                    <td>{job.templateId}</td>
                    <td>{getStatusBadge(job.status)}</td>
                    <td>{formatDate(job.createdAt)}</td>
                    <td>{job.sentAt ? formatDate(job.sentAt) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
