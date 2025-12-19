import { useState, useEffect } from 'react';
import { getTemplates, getRecipients, sendNotification } from '../services/api';
import type { Template, Recipient, NotificationChannel } from '../types';

export default function SendNotification() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<NotificationChannel[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesData, recipientsData] = await Promise.all([
        getTemplates(),
        getRecipients(),
      ]);
      setTemplates(templatesData);
      setRecipients(recipientsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
    if (template) {
      setSelectedChannels([template.channel]);
      // Initialize variables
      const vars: Record<string, string> = {};
      template.variables.forEach(v => {
        vars[v.name] = v.defaultValue || '';
      });
      setVariables(vars);
    }
  };

  const handleRecipientChange = (recipientId: string) => {
    const recipient = recipients.find(r => r.id === recipientId);
    setSelectedRecipient(recipient || null);
  };

  const handleChannelToggle = (channel: NotificationChannel) => {
    if (selectedChannels.includes(channel)) {
      setSelectedChannels(selectedChannels.filter(c => c !== channel));
    } else {
      setSelectedChannels([...selectedChannels, channel]);
    }
  };

  const handleVariableChange = (name: string, value: string) => {
    setVariables({ ...variables, [name]: value });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTemplate || !selectedRecipient || selectedChannels.length === 0) {
      setMessage({ type: 'error', text: 'Please select template, recipient, and at least one channel' });
      return;
    }

    // Check required variables
    const missingVars = selectedTemplate.variables
      .filter(v => v.required && !variables[v.name])
      .map(v => v.name);
    
    if (missingVars.length > 0) {
      setMessage({ type: 'error', text: `Missing required variables: ${missingVars.join(', ')}` });
      return;
    }

    try {
      setSending(true);
      setMessage(null);
      
      const result = await sendNotification({
        templateId: selectedTemplate.id,
        channels: selectedChannels,
        recipient: selectedRecipient,
        variables,
        priority: 'normal',
      });

      if (result.success) {
        setMessage({ type: 'success', text: `Notification queued successfully! Job IDs: ${result.jobIds.join(', ')}` });
        // Reset form
        setSelectedTemplate(null);
        setSelectedChannels([]);
        setVariables({});
      } else {
        setMessage({ type: 'error', text: `Failed: ${result.errors.join(', ')}` });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setMessage({ type: 'error', text: 'Failed to send notification' });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <h1 className="card-title" style={{ marginBottom: '2rem' }}>Send Notification</h1>

      {message && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
          {message.text}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSend}>
          {/* Template Selection */}
          <div className="form-group">
            <label className="form-label">Select Template *</label>
            <select
              className="form-select"
              value={selectedTemplate?.id || ''}
              onChange={(e) => handleTemplateChange(e.target.value)}
              required
            >
              <option value="">-- Select a template --</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.channel})
                </option>
              ))}
            </select>
          </div>

          {/* Recipient Selection */}
          <div className="form-group">
            <label className="form-label">Select Recipient *</label>
            <select
              className="form-select"
              value={selectedRecipient?.id || ''}
              onChange={(e) => handleRecipientChange(e.target.value)}
              required
            >
              <option value="">-- Select a recipient --</option>
              {recipients.map(recipient => (
                <option key={recipient.id} value={recipient.id}>
                  {recipient.name} - {recipient.email || recipient.phone || recipient.whatsappNumber}
                </option>
              ))}
            </select>
            {selectedRecipient && (
              <div className="form-help">
                Opt-ins: Email: {selectedRecipient.optIns.email ? '✓' : '✗'}, 
                SMS: {selectedRecipient.optIns.sms ? '✓' : '✗'}, 
                WhatsApp: {selectedRecipient.optIns.whatsapp ? '✓' : '✗'}
              </div>
            )}
          </div>

          {/* Channel Selection */}
          {selectedTemplate && (
            <div className="form-group">
              <label className="form-label">Channels *</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedChannels.includes('email')}
                    onChange={() => handleChannelToggle('email')}
                    disabled={!selectedRecipient?.optIns.email || !selectedRecipient?.email}
                  />
                  Email
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedChannels.includes('sms')}
                    onChange={() => handleChannelToggle('sms')}
                    disabled={!selectedRecipient?.optIns.sms || !selectedRecipient?.phone}
                  />
                  SMS
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedChannels.includes('whatsapp')}
                    onChange={() => handleChannelToggle('whatsapp')}
                    disabled={!selectedRecipient?.optIns.whatsapp || !selectedRecipient?.whatsappNumber}
                  />
                  WhatsApp
                </label>
              </div>
            </div>
          )}

          {/* Template Variables */}
          {selectedTemplate && selectedTemplate.variables.length > 0 && (
            <div className="form-group">
              <label className="form-label">Template Variables</label>
              {selectedTemplate.variables.map(variable => (
                <div key={variable.name} style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontSize: '0.875rem' }}>
                    {variable.name} {variable.required && '*'}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={variable.description}
                    value={variables[variable.name] || ''}
                    onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                    required={variable.required}
                  />
                  <div className="form-help">{variable.description}</div>
                </div>
              ))}
            </div>
          )}

          {/* Submit Button */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={sending}>
              {sending ? 'Sending...' : 'Send Notification'}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setSelectedTemplate(null);
                setSelectedRecipient(null);
                setSelectedChannels([]);
                setVariables({});
                setMessage(null);
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
