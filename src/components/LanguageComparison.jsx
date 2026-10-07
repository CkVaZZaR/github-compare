import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useTheme } from "../theme";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const LanguageComparison = ({ user1, user2 }) => {
  const { theme } = useTheme();
  if (
    !user1.languages ||
    !user2.languages ||
    Object.keys(user1.languages).length === 0 ||
    Object.keys(user2.languages).length === 0
  ) {
    return (
      <div className='chart-container'>
        <h2>Сравнение языков программирования</h2>
        <p>Недостаточно данных для сравнения языков</p>
      </div>
    );
  }

  // Собираем все уникальные языки
  const allLanguages = new Set([
    ...Object.keys(user1.languages),
    ...Object.keys(user2.languages),
  ]);

  // Подготавливаем данные для диаграммы
  const sortedLanguages = Array.from(allLanguages).sort();

  const user1Data = sortedLanguages.map((lang) => user1.languages[lang] || 0);
  const user2Data = sortedLanguages.map((lang) => user2.languages[lang] || 0);

  const data = {
    labels: sortedLanguages,
    datasets: [
      {
        label: user1.login,
        data: user1Data,
        backgroundColor: "rgba(54, 162, 235, 0.7)",
      },
      {
        label: user2.login,
        data: user2Data,
        backgroundColor: "rgba(255, 99, 132, 0.7)",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "Сравнение языков программирования",
        font: { size: 16 },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.raw} репозиториев`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Количество репозиториев",
        },
      },
      x: {
        title: {
          display: true,
          text: "Языки программирования",
        },
      },
    },
  };

  // Рассчитываем общую статистику
  const user1Total = Object.values(user1.languages).reduce(
    (sum, count) => sum + count,
    0
  );
  const user2Total = Object.values(user2.languages).reduce(
    (sum, count) => sum + count,
    0
  );

  const topLanguagesUser1 = Object.entries(user1.languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([lang]) => lang);

  const topLanguagesUser2 = Object.entries(user2.languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([lang]) => lang);

  return (
    <div className='chart-container language-comparison'>
      <h2>Сравнение языков программирования</h2>

      <div className='language-stats'>
        <div className='user-stats'>
          <h3>{user1.login}</h3>
          <p>
            Всего языков: <strong>{Object.keys(user1.languages).length}</strong>
          </p>
          <p>
            Всего репозиториев: <strong>{user1Total}</strong>
          </p>
          <p>
            Топ-3 языка:{" "}
            <strong>{topLanguagesUser1.join(", ") || "нет данных"}</strong>
          </p>
        </div>

        <div className='user-stats'>
          <h3>{user2.login}</h3>
          <p>
            Всего языков: <strong>{Object.keys(user2.languages).length}</strong>
          </p>
          <p>
            Всего репозиториев: <strong>{user2Total}</strong>
          </p>
          <p>
            Топ-3 языка:{" "}
            <strong>{topLanguagesUser2.join(", ") || "нет данных"}</strong>
          </p>
        </div>
      </div>

      <div className='chart-wrapper'>
        {/* <Bar data={data} options={options} /> */}
        <Bar
          key={theme}
          data={data}
          options={{
            ...options,
            plugins: {
              ...options.plugins,
              legend: {
                ...options.plugins.legend,
                labels: {
                  font: {
                    size: 12, // Увеличиваем размер шрифта для PDF
                  },
                },
              },
            },
            scales: {
              ...options.scales,
              x: {
                ...options.scales.x,
                ticks: {
                  font: {
                    size: 10, // Уменьшаем размер шрифта для оси X
                  },
                },
              },
              y: {
                ...options.scales.y,
                ticks: {
                  font: {
                    size: 10, // Уменьшаем размер шрифта для оси Y
                  },
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default LanguageComparison;
