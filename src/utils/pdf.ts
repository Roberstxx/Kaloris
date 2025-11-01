import jsPDF from 'jspdf';
import { IntakeEntry, DailyLog } from '../types';
import { formatKcal } from './format';
import { getDateLabel } from './date';
import { AppUser } from '../context/SessionContext';

interface PDFExportData {
  user: AppUser;
  date: string;
  dailyLog: DailyLog;
  foodNames: Map<string, string>;
}

export const exportToPDF = async (data: PDFExportData) => {
  const { user, date, dailyLog, foodNames } = data;
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  let y = 20;

  // Title
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Reporte de Calorías', pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Date
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Fecha: ${getDateLabel(date)}`, 20, y);
  y += 10;

  // User info
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Datos del Usuario', 20, y);
  y += 8;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Nombre: ${user.name}`, 20, y);
  y += 6;
  
  if (user.age && user.sex) {
    const sexLabel = user.sex === 'male' ? 'Hombre' : 'Mujer';
    pdf.text(`Edad: ${user.age} años | Sexo: ${sexLabel}`, 20, y);
    y += 6;
  }
  
  if (user.weightKg && user.heightCm) {
    pdf.text(`Peso: ${user.weightKg} kg | Altura: ${user.heightCm} cm`, 20, y);
    y += 6;
  }
  
  if (user.tdee) {
    pdf.text(`Meta Calórica (TDEE): ${formatKcal(user.tdee)}`, 20, y);
    y += 10;
  }

  // Summary
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Resumen del Día', 20, y);
  y += 8;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  
  const consumed = dailyLog.totalKcal;
  const target = user.tdee || 2000;
  const difference = consumed - target;
  const percentConsumed = target > 0 ? (consumed / target) * 100 : 0;

  pdf.text(`Total Consumido: ${formatKcal(consumed)}`, 20, y);
  y += 6;
  pdf.text(`Meta: ${formatKcal(target)}`, 20, y);
  y += 6;
  
  const diffText = difference >= 0 
    ? `Excedente: ${formatKcal(Math.abs(difference))}`
    : `Restante: ${formatKcal(Math.abs(difference))}`;
  pdf.text(diffText, 20, y);
  y += 6;

  // Status
  let status = 'En meta';
  if (percentConsumed > 105) {
    status = 'Excedido';
  } else if (percentConsumed >= 95) {
    status = 'Cerca del límite';
  }
  pdf.text(`Estado: ${status} (${percentConsumed.toFixed(1)}%)`, 20, y);
  y += 12;

  // Food list
  if (dailyLog.entries.length > 0) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Alimentos Consumidos', 20, y);
    y += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    dailyLog.entries.forEach((entry, index) => {
      if (y > 270) {
        pdf.addPage();
        y = 20;
      }

      const name = entry.customName || foodNames.get(entry.foodId || '') || 'Alimento';
      const kcal = entry.kcalPerUnit * entry.units;
      const units = entry.units === 1 ? '1 porción' : `${entry.units} porciones`;
      
      pdf.text(`${index + 1}. ${name}`, 20, y);
      y += 5;
      pdf.setFont('helvetica', 'italic');
      pdf.text(`   ${units} - ${formatKcal(kcal)}`, 20, y);
      pdf.setFont('helvetica', 'normal');
      y += 7;
    });
  } else {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'italic');
    pdf.text('No se registraron alimentos este día', 20, y);
  }

  // Footer
  y = pdf.internal.pageSize.getHeight() - 15;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  pdf.text('Contador de Calorías - Generado el ' + new Date().toLocaleDateString('es-MX'), 
    pageWidth / 2, y, { align: 'center' });

  // Download
  pdf.save(`reporte-calorias-${date}.pdf`);
};
