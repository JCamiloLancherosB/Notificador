import axios from 'axios';
import type { Template, NotificationRequest, NotificationJob, AnalyticsSummary, Recipient } from '../types';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Templates
export const getTemplates = async (): Promise<Template[]> => {
  const response = await api.get('/templates');
  return response.data.templates;
};

export const getTemplateById = async (id: string): Promise<Template> => {
  const response = await api.get(`/templates/${id}`);
  return response.data.template;
};

export const getTemplatesByChannel = async (channel: string): Promise<Template[]> => {
  const response = await api.get(`/templates/channel/${channel}`);
  return response.data.templates;
};

export const previewTemplate = async (id: string, variables: Record<string, string>) => {
  const response = await api.post(`/templates/${id}/preview`, { variables });
  return response.data.rendered;
};

// Notifications
export const sendNotification = async (request: NotificationRequest) => {
  const response = await api.post('/notifications/send', request);
  return response.data;
};

export const sendBulkNotification = async (request: any) => {
  const response = await api.post('/notifications/send-bulk', request);
  return response.data;
};

// Analytics
export const getAnalyticsSummary = async (filters?: any): Promise<AnalyticsSummary> => {
  const response = await api.get('/analytics/summary', { params: filters });
  return response.data.summary;
};

export const getNotificationHistory = async (filters?: any): Promise<NotificationJob[]> => {
  const response = await api.get('/analytics/history', { params: filters });
  return response.data.history;
};

export const getRecentActivity = async (days: number = 7) => {
  const response = await api.get('/analytics/activity/recent', { params: { days } });
  return response.data.activity;
};

export const getChannelPerformance = async () => {
  const response = await api.get('/analytics/performance/channels');
  return response.data.performance;
};

// Recipients
export const getRecipients = async (): Promise<Recipient[]> => {
  const response = await api.get('/recipients');
  return response.data.recipients;
};

export const getRecipientById = async (id: string): Promise<Recipient> => {
  const response = await api.get(`/recipients/${id}`);
  return response.data.recipient;
};

export const saveRecipient = async (recipient: Recipient): Promise<Recipient> => {
  const response = await api.post('/recipients', recipient);
  return response.data.recipient;
};

export const updateOptIns = async (id: string, optIns: any) => {
  const response = await api.patch(`/recipients/${id}/opt-ins`, optIns);
  return response.data.optIns;
};

// Scheduler
export const getSchedulerStatus = async () => {
  const response = await api.get('/scheduler/status');
  return response.data.status;
};

export const processJobs = async () => {
  const response = await api.post('/scheduler/process');
  return response.data;
};
