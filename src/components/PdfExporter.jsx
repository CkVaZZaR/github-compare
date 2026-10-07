// src/components/PdfExporter.jsx
import React from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const PdfExporter = ({ contentId, fileName = "github_comparison.pdf" }) => {
  const exportToPdf = async () => {
    const element = document.getElementById(contentId);
    if (!element) return;

    try {
      // Создаем холст из HTML-элемента
      const canvas = await html2canvas(element, {
        scale: 2, // Улучшаем качество
        useCORS: true, // Разрешаем кросс-доменные изображения
        logging: false, // Отключаем логирование
        backgroundColor: getComputedStyle(document.body).backgroundColor, // Фон текущей темы
      });

      // Получаем размеры
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210; // Ширина A4 в мм
      const pageHeight = 297; // Высота A4 в мм
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Создаем PDF
      const pdf = new jsPDF("p", "mm", "a4");
      let heightLeft = imgHeight;
      let position = 0;

      // Добавляем первую страницу
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Добавляем дополнительные страницы при необходимости
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Сохраняем PDF
      pdf.save(fileName);
    } catch (error) {
      console.error("Ошибка при создании PDF:", error);
      alert("Не удалось создать PDF файл");
    }
  };

  return (
    <button onClick={exportToPdf} className='export-button'>
      Экспорт в PDF
    </button>
  );
};

export default PdfExporter;
