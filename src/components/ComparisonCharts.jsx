// src/components/ComparisonCharts.jsx
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

const ComparisonCharts = ({ user1, user2 }) => {
  const { theme } = useTheme();
  if (!user1 || !user2) return null;

  const data = {
    labels: ["Followers", "Following", "Repositories", "Gists"],
    datasets: [
      {
        label: user1.login,
        data: [
          user1.followers,
          user1.following,
          user1.public_repos,
          user1.public_gists,
        ],
        backgroundColor: "rgba(54, 162, 235, 0.7)",
      },
      {
        label: user2.login,
        data: [
          user2.followers,
          user2.following,
          user2.public_repos,
          user2.public_gists,
        ],
        backgroundColor: "rgba(255, 99, 132, 0.7)",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "GitHub Profile Comparison",
        font: { size: 16 },
      },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <div className='comparison-chart'>
      {/* <Bar data={data} options={options} /> */}
      <Bar
        key={theme}
        data={data}
        options={{
          ...options,
          plugins: {
            ...options.plugins,
            legend: {
              labels: {
                font: {
                  size: 12, // Увеличиваем размер шрифта для PDF
                },
              },
            },
          },
          scales: {
            y: {
              ...options.scales.y,
              ticks: {
                font: {
                  size: 10, // Уменьшаем размер шрифта для оси Y
                },
              },
            },
            x: {
              ticks: {
                font: {
                  size: 10, // Уменьшаем размер шрифта для оси X
                },
              },
            },
          },
        }}
      />
    </div>
  );
};

export default ComparisonCharts;
