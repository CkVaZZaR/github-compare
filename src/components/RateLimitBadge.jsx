// src/components/RateLimitBadge.jsx
import React, { useEffect, useState } from "react";
import {
  getRateLimit,
  refreshRateLimit,
  subscribeRateLimit,
} from "../rateLimit";

const LOW_LIMIT = 10;

const RateLimitBadge = () => {
  const [rate, setRate] = useState(getRateLimit);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const unsubscribe = subscribeRateLimit(setRate);
    refreshRateLimit();
    // раз в минуту обновляем лимит и время до сброса
    const timer = setInterval(() => {
      refreshRateLimit();
      setNow(Date.now());
    }, 60000);
    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  if (!rate) return null;

  const minutesLeft = Math.max(1, Math.ceil((rate.reset - now) / 60000));
  const resetTime = new Date(rate.reset).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const level =
    rate.remaining === 0 ? "empty" : rate.remaining < LOW_LIMIT ? "low" : "ok";

  return (
    <span
      className={`rate-limit rate-limit--${level}`}
      title={`Лимит GitHub API: ${rate.remaining} из ${rate.limit} запросов. Сброс в ${resetTime}`}
    >
      API {rate.remaining}/{rate.limit}
      {rate.remaining === 0 && ` · через ${minutesLeft} мин`}
    </span>
  );
};

export default RateLimitBadge;
