import React, { useEffect, useState, useMemo } from 'react'; 
import { collection, onSnapshot } from 'firebase/firestore';
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

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfWeek(date) {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getCurrentWeekRange() {
  const today = new Date();
  return { start: getStartOfWeek(today), end: getEndOfWeek(today) };
}

function getLastWeekRange() {
  const today = new Date();
  const startCurrentWeek = getStartOfWeek(today);
  const startLastWeek = new Date(startCurrentWeek);
  startLastWeek.setDate(startLastWeek.getDate() - 7);
  const endLastWeek = getEndOfWeek(startLastWeek);
  return { start: startLastWeek, end: endLastWeek };
}

const ReportesPorColonia = () => {
  const [coloniasActual, setColoniasActual] = useState({});
  const [coloniasPasada, setColoniasPasada] = useState({});

  const currentWeekRange = useMemo(() => getCurrentWeekRange(), []);
  const lastWeekRange = useMemo(() => getLastWeekRange(), []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'reportes'), (snapshot) => {
      const countsActual = {};
      const countsPasada = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        const creadoEn = data.creadoEn;

        if (!creadoEn || typeof creadoEn.toDate !== 'function') {
          console.warn('Reporte sin fecha válida:', doc.id);
          return;
        }

        const fecha = creadoEn.toDate();
        const colonia = (data.colonia || 'Desconocida').trim();

        if (fecha >= currentWeekRange.start && fecha <= currentWeekRange.end) {
          countsActual[colonia] = (countsActual[colonia] || 0) + 1;
        }

        if (fecha >= lastWeekRange.start && fecha <= lastWeekRange.end) {
          countsPasada[colonia] = (countsPasada[colonia] || 0) + 1;
        }
      });

      setColoniasActual(countsActual);
      setColoniasPasada(countsPasada);
    });

    return () => unsubscribe();
  }, [currentWeekRange, lastWeekRange]);

  const prepareChartData = (counts, label) => {
    const sortedEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const labels = sortedEntries.map(([colonia]) => colonia);
    const data = sortedEntries.map(([, count]) => count);

    // Encontrar máximo para resaltar
    const maxCount = Math.max(...data, 0);

    // Colores: resaltar max con naranja fuerte, resto más tenue
    const backgroundColor = data.map(count =>
      count === maxCount ? 'rgba(255, 99, 32, 0.9)' : 'rgba(255, 159, 64, 0.5)'
    );

    return {
      labels,
      datasets: [
        {
          label,
          data,
          backgroundColor,
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

  const chartDataActual = useMemo(() => prepareChartData(coloniasActual, 'Reportes por colonia (Semana Actual)'), [coloniasActual]);
  const chartDataPasada = useMemo(() => prepareChartData(coloniasPasada, 'Reportes por colonia (Semana Pasada)'), [coloniasPasada]);

  return (
    <div style={{ marginTop: 30 }}>
      <h2>Reportes por Colonia</h2>

      <section style={{ marginBottom: 40 }}>
        <h3>Semana Actual ({currentWeekRange.start.toLocaleDateString()} - {currentWeekRange.end.toLocaleDateString()})</h3>
        {chartDataActual.labels.length > 0 ? (
          <Bar data={chartDataActual} options={chartOptions} />
        ) : (
          <p>No hay reportes registrados esta semana.</p>
        )}
      </section>

      <section>
        <h3>Semana Pasada ({lastWeekRange.start.toLocaleDateString()} - {lastWeekRange.end.toLocaleDateString()})</h3>
        {chartDataPasada.labels.length > 0 ? (
          <Bar data={chartDataPasada} options={chartOptions} />
        ) : (
          <p>No hay reportes registrados la semana pasada.</p>
        )}
      </section>
    </div>
  );
};

export default ReportesPorColonia;
