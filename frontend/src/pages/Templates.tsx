import { useState, useEffect } from 'react';
import { getTemplates } from '../services/api';
import type { Template } from '../types';

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(t =>
    filter === '' || t.channel === filter
  );

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="card-header">
        <h1 className="card-title">Templates ({templates.length})</h1>
        <button onClick={loadTemplates} className="btn btn-outline btn-small">
          Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="card">
        <div className="form-group">
          <label className="form-label">Filter by Channel</label>
          <select
            className="form-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">All Channels</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-2">
        {filteredTemplates.map(template => (
          <div key={template.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelectedTemplate(template)}>
            <h3>{template.name}</h3>
            <p style={{ marginTop: '0.5rem', marginBottom: '1rem', color: '#666' }}>
              <span className="badge badge-info" style={{ textTransform: 'uppercase' }}>
                {template.channel}
              </span>
              {' '}
              <span className="badge badge-secondary">
                {template.type.replace('_', ' ')}
              </span>
            </p>
            {template.subject && (
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Subject:</strong> {template.subject}
              </p>
            )}
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>Variables:</strong> {template.variables.map(v => v.name).join(', ')}
            </p>
            <button className="btn btn-outline btn-small" style={{ marginTop: '1rem' }}>
              View Details
            </button>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <p>No templates found</p>
        </div>
      )}

      {/* Template Details Modal */}
      {selectedTemplate && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem',
          }}
          onClick={() => setSelectedTemplate(null)}
        >
          <div 
            className="card" 
            style={{ maxWidth: '800px', width: '100%', maxHeight: '80vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header">
              <h2 className="card-title">{selectedTemplate.name}</h2>
              <button onClick={() => setSelectedTemplate(null)} className="btn btn-outline btn-small">
                Close
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <span className="badge badge-info" style={{ textTransform: 'uppercase' }}>
                {selectedTemplate.channel}
              </span>
              {' '}
              <span className="badge badge-secondary">
                {selectedTemplate.type.replace('_', ' ')}
              </span>
            </div>

            {selectedTemplate.subject && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>Subject:</strong>
                <p style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#f5f5f5', borderRadius: '4px' }}>
                  {selectedTemplate.subject}
                </p>
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <strong>Body:</strong>
              <pre style={{ 
                marginTop: '0.5rem', 
                padding: '1rem', 
                background: '#f5f5f5', 
                borderRadius: '4px',
                whiteSpace: 'pre-wrap',
                fontSize: '0.875rem',
              }}>
                {selectedTemplate.body}
              </pre>
            </div>

            <div>
              <strong>Variables ({selectedTemplate.variables.length}):</strong>
              <table style={{ marginTop: '0.5rem' }}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Required</th>
                    <th>Default</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTemplate.variables.map(v => (
                    <tr key={v.name}>
                      <td><code>{v.name}</code></td>
                      <td>{v.description}</td>
                      <td>{v.required ? '✓' : '-'}</td>
                      <td>{v.defaultValue || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
