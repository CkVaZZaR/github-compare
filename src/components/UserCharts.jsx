// src/components/UserCharts.jsx
import React from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { useTheme } from "../theme";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const UserCharts = ({ user }) => {
  const { theme } = useTheme();
  if (!user) return null;

  const languageData = {
    labels: Object.keys(user.languageStats || {}),
    datasets: [
      {
        data: Object.values(user.languageStats || {}),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
          "#8AC926",
          "#1982C4",
        ],
      },
    ],
  };

  // График основных метрик
  const barData = {
    labels: ["Followers", "Following", "Public Repos", "Gists"],
    datasets: [
      {
        label: "GitHub Stats",
        data: [
          user.followers,
          user.following,
          user.public_repos,
          user.public_gists,
        ],
        backgroundColor: [
          "rgba(54, 162, 235, 0.7)",
          "rgba(75, 192, 192, 0.7)",
          "rgba(153, 102, 255, 0.7)",
          "rgba(255, 159, 64, 0.7)",
        ],
        borderColor: [
          "rgba(54, 162, 235, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Круговая диаграмма активности
  const pieData = {
    labels: ["Repositories", "Gists"],
    datasets: [
      {
        data: [user.public_repos, user.public_gists],
        backgroundColor: [
          "rgba(153, 102, 255, 0.7)",
          "rgba(255, 159, 64, 0.7)",
        ],
        borderColor: ["rgba(153, 102, 255, 1)", "rgba(255, 159, 64, 1)"],
        borderWidth: 1,
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
        text: "GitHub Activity",
        font: { size: 16 },
      },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  // у круговых диаграмм осей нет
  const { scales: _scales, ...pieOptions } = options;

  return (
    <div className='charts-container'>
      <div className='chart'>
        <Bar key={theme} data={barData} options={options} />
      </div>
      <div className='chart'>
        <Pie key={theme} data={pieData} options={pieOptions} />
      </div>

      {user.languageStats && (
        <div className='chart'>
          <Pie
            key={theme}
            data={languageData}
            options={{
              ...pieOptions,
              plugins: {
                ...pieOptions.plugins,
                title: {
                  ...options.plugins.title,
                  text: "Programming Languages",
                },
              },
            }}
          />
        </div>
      )}
    </div>
  );
};

export default UserCharts;
