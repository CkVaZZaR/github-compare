// src/components/AuthButton.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useSearchParams } from "react-router-dom";
import { API } from "../api";
import { resetRateLimit } from "../rateLimit";

// Вход через GitHub OAuth: у вошедшего пользователя свой лимит 5000 запросов/ч
const AuthButton = () => {
  const [auth, setAuth] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const failed = searchParams.has("auth_error");

  useEffect(() => {
    axios
      .get(`${API}/auth/me`)
      .then(({ data }) => setAuth(data))
      .catch(() => setAuth(null));
  }, []);

  useEffect(() => {
    if (!failed) return;
    // Убираем флаг из адреса, сообщение висит до следующей навигации
    const timer = setTimeout(() => {
      searchParams.delete("auth_error");
      setSearchParams(searchParams, { replace: true });
    }, 5000);
    return () => clearTimeout(timer);
  }, [failed, searchParams, setSearchParams]);

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`);
    } finally {
      setAuth((prev) => ({ ...prev, user: null }));
      resetRateLimit();
    }
  };

  if (!auth?.enabled) return null;

  if (auth.user) {
    return (
      <span className='auth'>
        <img className='auth__avatar' src={auth.user.avatar_url} alt='' />
        <span className='auth__login'>{auth.user.login}</span>
        <button type='button' className='auth__button' onClick={logout}>
          Выйти
        </button>
      </span>
    );
  }

  const next = encodeURIComponent(location.pathname + location.search);
  return (
    <span className='auth'>
      {failed && <span className='auth__error'>Не удалось войти</span>}
      <a
        className='auth__button auth__button--primary'
        href={`${API}/auth/login?next=${next}`}
        title='Личный лимит 5000 запросов/ч вместо общего'
      >
        Войти через GitHub
      </a>
    </span>
  );
};

export default AuthButton;
