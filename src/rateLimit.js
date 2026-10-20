// src/rateLimit.js
import axios from "axios";
import { API } from "./api";

// Текущий лимит GitHub API: { limit, remaining, reset (мс) }
let state = null;
const listeners = new Set();

const setState = (next) => {
  // Внутри одного окна лимит только убывает: параллельные ответы приходят
  // в произвольном порядке, а /rate_limit может отставать
  if (
    state &&
    state.limit === next.limit &&
    Date.now() < state.reset &&
    next.remaining > state.remaining
  ) {
    return;
  }
  state = next;
  listeners.forEach((listener) => listener(state));
};

export const getRateLimit = () => state;

export const subscribeRateLimit = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const readHeaders = (response) => {
  if (!response?.config?.url?.startsWith(API)) return;
  const limit = response.headers["x-ratelimit-limit"];
  const remaining = response.headers["x-ratelimit-remaining"];
  const reset = response.headers["x-ratelimit-reset"];
  if (limit === undefined || remaining === undefined) return;
  setState({
    limit: Number(limit),
    remaining: Number(remaining),
    reset: Number(reset) * 1000,
  });
};

// Каждый ответ бэкенда приносит последний известный лимит GitHub в заголовках
axios.interceptors.response.use(
  (response) => {
    readHeaders(response);
    return response;
  },
  (error) => {
    readHeaders(error.response);
    return Promise.reject(error);
  }
);

// После входа/выхода лимит другой (личный или гостевой) — забываем старый,
// иначе setState отбросит значение, которое больше текущего
export const resetRateLimit = () => {
  state = null;
  return refreshRateLimit();
};

// Запрос к /rate_limit сам лимит не расходует
export const refreshRateLimit = async () => {
  try {
    const { data } = await axios.get(`${API}/rate_limit`);
    const core = data.resources.core;
    setState({
      limit: core.limit,
      remaining: core.remaining,
      reset: core.reset * 1000,
    });
  } catch {
    // нет сети — оставляем последнее известное значение
  }
};
