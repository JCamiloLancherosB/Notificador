import { useState, useEffect } from 'react';
import { getAnalyticsSummary, getChannelPerformance } from '../services/api';
import type { AnalyticsSummary } from '../types';

export default function Dashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryData, performanceData] = await Promise.all([
        getAnalyticsSummary(),
        getChannelPerformance(),
      ]);
      setSummary(summaryData);
      setPerformance(performanceData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="card-header">
        <h1 className="card-title">Dashboard</h1>
        <button onClick={loadDashboardData} className="btn btn-outline btn-small">
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      {summary && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{summary.totalSent}</div>
              <div className="stat-label">Total Sent</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{summary.totalDelivered}</div>
              <div className="stat-label">Delivered</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{summary.totalFailed}</div>
              <div className="stat-label">Failed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {summary.totalSent > 0 
                  ? `${Math.round((summary.totalDelivered / summary.totalSent) * 100)}%`
                  : '0%'
                }
              </div>
              <div className="stat-label">Delivery Rate</div>
            </div>
          </div>

          {/* Channel Performance */}
          <div className="card">
            <h2 className="card-title">Channel Performance</h2>
            <div className="grid grid-3">
              {performance?.channels.map((channel: any) => (
                <div key={channel.channel} className="stat-card">
                  <h3 style={{ textTransform: 'capitalize', marginBottom: '1rem' }}>
                    {channel.channel}
                  </h3>
                  <div style={{ textAlign: 'left' }}>
                    <p><strong>Sent:</strong> {channel.sent}</p>
                    <p><strong>Delivered:</strong> {channel.delivered}</p>
                    <p><strong>Failed:</strong> {channel.failed}</p>
                    <p><strong>Rate:</strong> {channel.deliveryRate.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Opt-in Ratios */}
          <div className="card">
            <h2 className="card-title">Opt-in Ratios</h2>
            <div className="grid grid-3">
              <div className="stat-card">
                <div className="stat-value">{Math.round(summary.optInRatios.email * 100)}%</div>
                <div className="stat-label">Email Opt-in</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{Math.round(summary.optInRatios.sms * 100)}%</div>
                <div className="stat-label">SMS Opt-in</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{Math.round(summary.optInRatios.whatsapp * 100)}%</div>
                <div className="stat-label">WhatsApp Opt-in</div>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="card">
            <h2 className="card-title">Status Breakdown</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Count</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(summary.byStatus).map(([status, count]) => (
                    <tr key={status}>
                      <td>
                        <span className={`badge badge-${
                          status === 'delivered' ? 'success' :
                          status === 'failed' ? 'danger' :
                          status === 'sent' ? 'success' :
                          status === 'pending' || status === 'queued' ? 'warning' :
                          'secondary'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td>{count as number}</td>
                      <td>
                        {summary.totalSent > 0
                          ? `${Math.round(((count as number) / summary.totalSent) * 100)}%`
                          : '0%'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
