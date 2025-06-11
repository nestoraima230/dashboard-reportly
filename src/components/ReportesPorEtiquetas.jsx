import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// Funciones para rangos
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7; // lunes = 0
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfWeek(startOfWeek) {
  const end = new Date(startOfWeek);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getCurrentWeekRange() {
  const start = getStartOfWeek(new Date());
  const end = getEndOfWeek(start);
  return { start, end };
}

function getLastWeekRange() {
  const startCurrentWeek = getStartOfWeek(new Date());
  const start = new Date(startCurrentWeek);
  start.setDate(start.getDate() - 7);
  const end = getEndOfWeek(start);
  return { start, end };
}

const ReportesPorEtiquetas = () => {
  const [etiquetasActual, setEtiquetasActual] = useState({});
  const [etiquetasPasada, setEtiquetasPasada] = useState({});

  // Obtener rangos una sola vez
  const currentWeekRange = useMemo(() => getCurrentWeekRange(), []);
  const lastWeekRange = useMemo(() => getLastWeekRange(), []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'reportes'), (snapshot) => {
      const countsActual = {};
      const countsPasada = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        let fecha = null;

        if (data.creadoEn instanceof Timestamp) {
          fecha = data.creadoEn.toDate();
        }

        if (fecha) {
          // Semana actual
          if (fecha >= currentWeekRange.start && fecha <= currentWeekRange.end) {
            (data.etiquetas || []).forEach((etiqueta) => {
              const clean = etiqueta.trim();
              if (clean) countsActual[clean] = (countsActual[clean] || 0) + 1;
            });
          }

          // Semana pasada
          if (fecha >= lastWeekRange.start && fecha <= lastWeekRange.end) {
            (data.etiquetas || []).forEach((etiqueta) => {
              const clean = etiqueta.trim();
              if (clean) countsPasada[clean] = (countsPasada[clean] || 0) + 1;
            });
          }
        }
      });

      setEtiquetasActual(countsActual);
      setEtiquetasPasada(countsPasada);
    });

    return () => unsubscribe();
  }, [currentWeekRange, lastWeekRange]);

  // Función para preparar datos ordenados para el gráfico
  const prepareChartData = (counts) => {
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const labels = entries.map(([label]) => label);
    const dataValues = entries.map(([, count]) => count);

    return {
      labels,
      datasets: [
        {
          label: 'Cantidad de reportes',
          data: dataValues,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderRadius: 4,
          barThickness: 20,
        },
      ],
    };
  };

  const chartOptions = {
    indexAxis: 'y',
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: { beginAtZero: true },
    },
  };

  const chartDataActual = useMemo(() => prepareChartData(etiquetasActual), [etiquetasActual]);
  const chartDataPasada = useMemo(() => prepareChartData(etiquetasPasada), [etiquetasPasada]);

  return (
    <div style={{ marginTop: 30 }}>
      <h2>Reportes por Etiqueta</h2>

      <section style={{ marginBottom: 40 }}>
        <h3>Semana Actual ({currentWeekRange.start.toLocaleDateString()} - {currentWeekRange.end.toLocaleDateString()})</h3>
        {chartDataActual.labels.length > 0 ? (
          <Bar data={chartDataActual} options={chartOptions} />
        ) : (
          <p>No hay datos disponibles esta semana.</p>
        )}
      </section>

      <section>
        <h3>Semana Pasada ({lastWeekRange.start.toLocaleDateString()} - {lastWeekRange.end.toLocaleDateString()})</h3>
        {chartDataPasada.labels.length > 0 ? (
          <Bar data={chartDataPasada} options={chartOptions} />
        ) : (
          <p>No hay datos disponibles la semana pasada.</p>
        )}
      </section>
    </div>
  );
};

export default ReportesPorEtiquetas;
