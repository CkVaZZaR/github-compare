// src/api.js
// Все запросы к GitHub идут через бэкенд (server/), в dev — через proxy Vite
export const API = "/api";

// Человекочитаемый текст ошибки по ответу бэкенда
export const errorMessage = (err, notFound) => {
  const status = err?.response?.status;
  if (status === 404) return notFound;
  if (status === 401) return "Доступ к GitHub отозван, войдите снова";
  if (status === 429) {
    const reset = err.response.data?.reset;
    const time = reset
      ? new Date(reset * 1000).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;
    if (err.response.data?.login_available) {
      return "Гостевой лимит запросов к GitHub исчерпан — войдите через GitHub, чтобы получить свои 5000 запросов/ч";
    }
    return time
      ? `Превышен лимит запросов к GitHub, повторите после ${time}`
      : "Превышен лимит запросов к GitHub, повторите позже";
  }
  return "Сервер недоступен, попробуйте позже";
};
