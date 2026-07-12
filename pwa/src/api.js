import { API_URL } from './config';

/**
 * API Service - handles communication with Google Apps Script
 * Includes offline queue and auth token management
 */

const OFFLINE_QUEUE_KEY = 'offlineExpenseQueue';
let authToken = localStorage.getItem('auth_token') || null;

// ===== AUTH =====
export function setAuthToken(token) {
  authToken = token;
}

// ===== POST (Write) =====
export async function addExpense(expense) {
  const payload = { action: 'addExpense', ...expense };
  return apiPost(payload);
}

export async function addStock(stock) {
  const payload = { action: 'addStock', ...stock };
  return apiPost(payload);
}

export async function addSIP(sip) {
  const payload = { action: 'addSIP', ...sip };
  return apiPost(payload);
}

// ===== GET (Read) =====
export async function getSummary() {
  return apiGet('getSummary');
}

export async function getExpenses(days = 7) {
  return apiGet('getExpenses', { days });
}

export async function getStocks() {
  return apiGet('getStocks');
}

export async function getSIPs() {
  return apiGet('getSIPs');
}

// ===== OFFLINE QUEUE =====
export function queueOfflineExpense(expense) {
  const queue = getOfflineQueue();
  queue.push({ ...expense, timestamp: Date.now() });
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export function getOfflineQueue() {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

export async function syncOfflineQueue() {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { synced: 0 };

  try {
    const payload = { action: 'addMultipleExpenses', expenses: queue };
    const result = await apiPost(payload);
    if (result.success) {
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
      return { synced: queue.length };
    }
    return { synced: 0, error: result.error };
  } catch (error) {
    return { synced: 0, error: error.message };
  }
}

// ===== CORE HTTP =====
async function apiPost(payload) {
  if (!navigator.onLine) {
    if (payload.action === 'addExpense') {
      queueOfflineExpense(payload);
      return { success: true, offline: true, message: 'Saved offline, will sync later' };
    }
    throw new Error('No internet connection');
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...payload, token: authToken })
    });

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: true, message: 'Entry added' };
    }
  } catch (error) {
    // Fallback: try GET method (works without CORS)
    try {
      const url = new URL(API_URL);
      url.searchParams.append('action', payload.action);
      url.searchParams.append('data', JSON.stringify(payload));
      url.searchParams.append('token', authToken);
      const response = await fetch(url.toString(), { redirect: 'follow' });
      const text = await response.text();
      return JSON.parse(text);
    } catch (fallbackError) {
      if (payload.action === 'addExpense') {
        queueOfflineExpense(payload);
        return { success: true, offline: true, message: 'Saved offline (network issue)' };
      }
      throw error;
    }
  }
}

async function apiGet(action, params = {}) {
  const url = new URL(API_URL);
  url.searchParams.append('action', action);
  url.searchParams.append('token', authToken);
  Object.entries(params).forEach(([key, val]) => url.searchParams.append(key, val));

  const response = await fetch(url.toString(), { redirect: 'follow' });
  const text = await response.text();
  try {
    const result = JSON.parse(text);
    // If unauthorized, clear session and reload
    if (result.error === 'Unauthorized') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.reload();
      throw new Error('Session expired. Please sign in again.');
    }
    return result;
  } catch (e) {
    if (e.message.includes('Session expired')) throw e;
    throw new Error('Invalid response from server');
  }
}
