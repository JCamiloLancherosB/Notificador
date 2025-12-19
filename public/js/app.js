// Configuration
const API_BASE_URL = '/api';
const API_KEY = 'test-api-key-12345'; // Use configured API key

// State
let currentTab = 'dashboard';
let templates = [];
let currentTemplate = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  loadDashboard();
  loadTemplates();
});

// Event Listeners
function initializeEventListeners() {
  // Tab navigation
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      switchTab(e.target.dataset.tab);
    });
  });

  // Send form
  document.getElementById('send-form').addEventListener('submit', handleSendNotification);
  document.getElementById('send-template').addEventListener('change', handleTemplateChange);
  document.getElementById('send-schedule').addEventListener('change', handleScheduleToggle);

  // Template form
  document.getElementById('create-template-btn').addEventListener('click', () => openTemplateModal());
  document.getElementById('template-form').addEventListener('submit', handleSaveTemplate);
  document.querySelector('.modal-close').addEventListener('click', closeTemplateModal);

  // Subscription form
  document.getElementById('subscription-form').addEventListener('submit', handleUpdateSubscription);

  // History filters
  document.getElementById('apply-filters').addEventListener('click', loadHistory);
  document.getElementById('clear-filters').addEventListener('click', clearFilters);

  // Close modal on outside click
  window.addEventListener('click', (e) => {
    const modal = document.getElementById('template-modal');
    if (e.target === modal) {
      closeTemplateModal();
    }
  });
}

// Tab Switching
function switchTab(tabName) {
  // Update buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  // Update content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(tabName).classList.add('active');

  currentTab = tabName;

  // Load data for the tab
  switch (tabName) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'templates':
      loadTemplates();
      break;
    case 'subscriptions':
      loadSubscriptions();
      break;
    case 'history':
      loadHistory();
      break;
  }
}

// API Calls
async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(API_KEY && { 'X-API-Key': API_KEY })
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// Dashboard
async function loadDashboard() {
  try {
    const analytics = await apiCall('/notifications/analytics');
    const subscriptions = await apiCall('/subscriptions/stats');

    // Update stats
    document.getElementById('stat-total').textContent = analytics.analytics.total;
    document.getElementById('stat-sent').textContent = analytics.analytics.byStatus.sent;
    document.getElementById('stat-failed').textContent = analytics.analytics.byStatus.failed;
    document.getElementById('stat-pending').textContent = analytics.analytics.byStatus.pending;

    // Update channel stats
    ['whatsapp', 'sms', 'email'].forEach(channel => {
      const stats = analytics.analytics.byChannel[channel];
      document.getElementById(`channel-${channel}-total`).textContent = stats.total;
      document.getElementById(`channel-${channel}-sent`).textContent = stats.sent;
      document.getElementById(`channel-${channel}-failed`).textContent = stats.failed;
    });

    // Update recent activity
    const activityList = document.getElementById('recent-activity-list');
    if (analytics.analytics.recentActivity.length === 0) {
      activityList.innerHTML = '<p class="text-muted">No recent activity</p>';
    } else {
      activityList.innerHTML = analytics.analytics.recentActivity.map(activity => `
        <div class="activity-item status-${activity.status}">
          <strong>${activity.channel.toUpperCase()}</strong> - ${activity.templateName}
          <span class="status-badge ${activity.status}">${activity.status}</span>
          <br>
          <small class="text-muted">
            Recipient: ${activity.recipientId} | ${new Date(activity.createdAt).toLocaleString()}
          </small>
        </div>
      `).join('');
    }

    // Update opt-in stats
    document.getElementById('optin-total').textContent = subscriptions.stats.total;
    document.getElementById('optin-in').textContent = subscriptions.stats.optedIn;
    document.getElementById('optin-out').textContent = subscriptions.stats.optedOut;

  } catch (error) {
    console.error('Failed to load dashboard:', error);
  }
}

// Templates
async function loadTemplates() {
  try {
    const data = await apiCall('/templates');
    templates = data.templates;

    // Update template select in send form
    const select = document.getElementById('send-template');
    select.innerHTML = '<option value="">Select a template...</option>' +
      templates.map(t => `<option value="${t.name}">${t.name} - ${t.description}</option>`).join('');

    // Update templates list
    const list = document.getElementById('templates-list');
    if (templates.length === 0) {
      list.innerHTML = '<p class="text-muted">No templates found</p>';
    } else {
      list.innerHTML = templates.map(template => `
        <div class="template-item">
          <h4>${template.name}</h4>
          <p>${template.description || 'No description'}</p>
          <div class="template-channels">
            ${template.channels.map(ch => `<span class="channel-badge">${ch}</span>`).join('')}
          </div>
          <p class="text-muted">Variables: ${template.variables.join(', ') || 'None'}</p>
          <div class="template-actions">
            <button class="btn btn-primary" onclick="editTemplate(${template.id})">Edit</button>
            <button class="btn btn-danger" onclick="deleteTemplate(${template.id})">Delete</button>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Failed to load templates:', error);
  }
}

function handleTemplateChange(e) {
  const templateName = e.target.value;
  const template = templates.find(t => t.name === templateName);

  const container = document.getElementById('variables-container');

  if (!template || !template.variables || template.variables.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <h4>Template Variables</h4>
    ${template.variables.map(varName => `
      <div class="form-group">
        <label>${varName}</label>
        <input type="text" id="var-${varName}" data-variable="${varName}" required>
      </div>
    `).join('')}
  `;
}

function openTemplateModal(template = null) {
  const modal = document.getElementById('template-modal');
  const form = document.getElementById('template-form');

  form.reset();

  if (template) {
    document.getElementById('template-modal-title').textContent = 'Edit Template';
    document.getElementById('template-id').value = template.id;
    document.getElementById('template-name').value = template.name;
    document.getElementById('template-description').value = template.description || '';
    document.getElementById('template-whatsapp').value = template.content_whatsapp || '';
    document.getElementById('template-sms').value = template.content_sms || '';
    document.getElementById('template-email-subject').value = template.content_email_subject || '';
    document.getElementById('template-email-body').value = template.content_email_body || '';
    document.getElementById('template-variables').value = template.variables.join(', ');
    document.getElementById('template-active').checked = template.is_active;

    // Set channels
    document.querySelectorAll('input[name="template-channel"]').forEach(cb => {
      cb.checked = template.channels.includes(cb.value);
    });
  } else {
    document.getElementById('template-modal-title').textContent = 'Create Template';
    document.getElementById('template-id').value = '';
  }

  modal.classList.add('active');
}

function closeTemplateModal() {
  document.getElementById('template-modal').classList.remove('active');
}

async function editTemplate(id) {
  const template = templates.find(t => t.id === id);
  if (template) {
    openTemplateModal(template);
  }
}

async function deleteTemplate(id) {
  if (!confirm('Are you sure you want to delete this template?')) {
    return;
  }

  try {
    await apiCall(`/templates/${id}`, { method: 'DELETE' });
    alert('Template deleted successfully');
    loadTemplates();
  } catch (error) {
    alert('Failed to delete template: ' + error.message);
  }
}

async function handleSaveTemplate(e) {
  e.preventDefault();

  const id = document.getElementById('template-id').value;
  const channels = Array.from(document.querySelectorAll('input[name="template-channel"]:checked'))
    .map(cb => cb.value);

  if (channels.length === 0) {
    alert('Please select at least one channel');
    return;
  }

  const variables = document.getElementById('template-variables').value
    .split(',')
    .map(v => v.trim())
    .filter(v => v);

  const templateData = {
    name: document.getElementById('template-name').value,
    description: document.getElementById('template-description').value,
    channels,
    content_whatsapp: document.getElementById('template-whatsapp').value || null,
    content_sms: document.getElementById('template-sms').value || null,
    content_email_subject: document.getElementById('template-email-subject').value || null,
    content_email_body: document.getElementById('template-email-body').value || null,
    variables,
    is_active: document.getElementById('template-active').checked
  };

  try {
    if (id) {
      await apiCall(`/templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(templateData)
      });
      alert('Template updated successfully');
    } else {
      await apiCall('/templates', {
        method: 'POST',
        body: JSON.stringify(templateData)
      });
      alert('Template created successfully');
    }

    closeTemplateModal();
    loadTemplates();
  } catch (error) {
    alert('Failed to save template: ' + error.message);
  }
}

// Send Notification
function handleScheduleToggle(e) {
  const container = document.getElementById('schedule-container');
  container.style.display = e.target.checked ? 'block' : 'none';
}

async function handleSendNotification(e) {
  e.preventDefault();

  const templateName = document.getElementById('send-template').value;
  const channels = Array.from(document.querySelectorAll('input[name="channel"]:checked'))
    .map(cb => cb.value);

  if (!templateName) {
    alert('Please select a template');
    return;
  }

  if (channels.length === 0) {
    alert('Please select at least one channel');
    return;
  }

  const userId = document.getElementById('send-userId').value;
  const channelsData = {
    whatsapp: document.getElementById('send-whatsapp').value,
    sms: document.getElementById('send-sms').value,
    email: document.getElementById('send-email').value
  };

  // Collect variables
  const variables = {};
  document.querySelectorAll('[data-variable]').forEach(input => {
    variables[input.dataset.variable] = input.value;
  });

  const recipients = [{
    userId,
    channels: channelsData
  }];

  const payload = {
    recipients,
    templateName,
    variables,
    channels
  };

  const isScheduled = document.getElementById('send-schedule').checked;
  const resultBox = document.getElementById('send-result');

  try {
    let result;
    if (isScheduled) {
      const scheduledAt = document.getElementById('send-scheduleTime').value;
      if (!scheduledAt) {
        alert('Please select a schedule time');
        return;
      }
      payload.scheduledAt = new Date(scheduledAt).toISOString();
      result = await apiCall('/notifications/schedule', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } else {
      result = await apiCall('/notifications/send', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }

    resultBox.className = 'result-box success';
    resultBox.style.display = 'block';
    resultBox.innerHTML = `
      <h4>✅ Success!</h4>
      <p>${isScheduled ? 'Notification scheduled' : 'Notification sent'} successfully</p>
      <pre>${JSON.stringify(result.results, null, 2)}</pre>
    `;

    // Reset form
    document.getElementById('send-form').reset();
    document.getElementById('variables-container').innerHTML = '';
  } catch (error) {
    resultBox.className = 'result-box error';
    resultBox.style.display = 'block';
    resultBox.innerHTML = `
      <h4>❌ Error</h4>
      <p>${error.message}</p>
    `;
  }
}

// Subscriptions
async function loadSubscriptions() {
  try {
    const data = await apiCall('/subscriptions');
    const subscriptions = data.subscriptions;

    const list = document.getElementById('subscriptions-list');
    if (subscriptions.length === 0) {
      list.innerHTML = '<p class="text-muted">No subscriptions found</p>';
    } else {
      list.innerHTML = subscriptions.map(sub => `
        <div class="subscription-item ${sub.optedIn ? '' : 'opted-out'}">
          <strong>${sub.userId}</strong> - ${sub.channel}
          <span class="status-badge ${sub.optedIn ? 'sent' : 'failed'}">
            ${sub.optedIn ? 'Opted In' : 'Opted Out'}
          </span>
          <br>
          <small class="text-muted">Contact: ${sub.contact}</small>
        </div>
      `).join('');
    }

    // Reload stats
    const stats = await apiCall('/subscriptions/stats');
    document.getElementById('optin-total').textContent = stats.stats.total;
    document.getElementById('optin-in').textContent = stats.stats.optedIn;
    document.getElementById('optin-out').textContent = stats.stats.optedOut;
  } catch (error) {
    console.error('Failed to load subscriptions:', error);
  }
}

async function handleUpdateSubscription(e) {
  e.preventDefault();

  const payload = {
    userId: document.getElementById('sub-userId').value,
    channel: document.getElementById('sub-channel').value,
    contact: document.getElementById('sub-contact').value,
    optedIn: document.getElementById('sub-optedIn').checked
  };

  const resultBox = document.getElementById('subscription-result');

  try {
    await apiCall('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    resultBox.className = 'result-box success';
    resultBox.style.display = 'block';
    resultBox.textContent = 'Subscription updated successfully';

    // Reset form
    document.getElementById('subscription-form').reset();

    // Reload subscriptions
    loadSubscriptions();
  } catch (error) {
    resultBox.className = 'result-box error';
    resultBox.style.display = 'block';
    resultBox.textContent = 'Failed to update subscription: ' + error.message;
  }
}

// History
async function loadHistory() {
  const channel = document.getElementById('filter-channel').value;
  const status = document.getElementById('filter-status').value;
  const recipientId = document.getElementById('filter-recipient').value;

  const params = new URLSearchParams();
  if (channel) params.append('channel', channel);
  if (status) params.append('status', status);
  if (recipientId) params.append('recipientId', recipientId);
  params.append('limit', '50');

  try {
    const data = await apiCall(`/notifications/history?${params.toString()}`);
    const notifications = data.notifications;

    const list = document.getElementById('history-list');
    if (notifications.length === 0) {
      list.innerHTML = '<p class="text-muted">No notifications found</p>';
    } else {
      list.innerHTML = notifications.map(notif => `
        <div class="history-item status-${notif.status}">
          <strong>${notif.channel.toUpperCase()}</strong> - ${notif.templateName}
          <span class="status-badge ${notif.status}">${notif.status}</span>
          <br>
          <small class="text-muted">
            Recipient: ${notif.recipientId} (${notif.recipientContact})<br>
            Created: ${new Date(notif.createdAt).toLocaleString()}
            ${notif.sentAt ? `| Sent: ${new Date(notif.sentAt).toLocaleString()}` : ''}
            ${notif.errorMessage ? `<br>Error: ${notif.errorMessage}` : ''}
          </small>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Failed to load history:', error);
  }
}

function clearFilters() {
  document.getElementById('filter-channel').value = '';
  document.getElementById('filter-status').value = '';
  document.getElementById('filter-recipient').value = '';
  loadHistory();
}
