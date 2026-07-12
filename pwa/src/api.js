import { API_URL } from './config';

/**
 * API Service - handles communication with Google Apps Script
 * Includes offline queue for when network is unavailable
 */

const OFFLINE_QUEUE_KEY = 'offlineExpenseQueue';

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
    // Queue expenses for offline sync
    if (payload.action === 'addExpense') {
      queueOfflineExpense(payload);
      return { success: true, offline: true, message: 'Saved offline, will sync later' };
    }
    throw new Error('No internet connection');
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload)
  });

  return response.json();
}

async function apiGet(action, params = {}) {
  const url = new URL(API_URL);
  url.searchParams.append('action', action);
  Object.entries(params).forEach(([key, val]) => url.searchParams.append(key, val));

  const response = await fetch(url.toString());
  return response.json();
}
