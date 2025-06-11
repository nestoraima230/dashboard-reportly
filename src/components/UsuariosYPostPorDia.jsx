import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const getStartAndEndOfMonth = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

const generarLabelsDias = () => {
  const dias = [];
  const now = new Date();
  const totalDias = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  for (let i = 1; i <= totalDias; i++) {
    dias.push(i.toString());
  }
  return dias;
};

const LineChartsMensuales = () => {
  const [usuariosPorDia, setUsuariosPorDia] = useState([]);
  const [reportesPorDia, setReportesPorDia] = useState([]);

  useEffect(() => {
    const { start, end } = getStartAndEndOfMonth();
    const diasMes = generarLabelsDias();

    // Inicializar contadores
    const usuarios = Array(diasMes.length).fill(0);
    const reportes = Array(diasMes.length).fill(0);

    // SUSCRIPCIÓN A USUARIOS
    const unsubUsuarios = onSnapshot(collection(db, 'usuarios'), (snapshot) => {
      const nuevosUsuarios = [...usuarios];
      snapshot.forEach((doc) => {
        const creadoEn = doc.data().creadoEn?.toDate?.();
        if (creadoEn && creadoEn >= start && creadoEn <= end) {
          const dia = creadoEn.getDate();
          nuevosUsuarios[dia - 1]++;
        }
      });
      setUsuariosPorDia(nuevosUsuarios);
    });

    // SUSCRIPCIÓN A REPORTES
    const unsubReportes = onSnapshot(collection(db, 'reportes'), (snapshot) => {
      const nuevosReportes = [...reportes];
      snapshot.forEach((doc) => {
        const creadoEn = doc.data().creadoEn?.toDate?.();
        if (creadoEn && creadoEn >= start && creadoEn <= end) {
          const dia = creadoEn.getDate();
          nuevosReportes[dia - 1]++;
        }
      });
      setReportesPorDia(nuevosReportes);
    });

    return () => {
      unsubUsuarios();
      unsubReportes();
    };
  }, []);

  const labels = generarLabelsDias();

  const chartUsuarios = {
    labels,
    datasets: [
      {
        label: 'Usuarios nuevos por día (mes actual)',
        data: usuariosPorDia,
        fill: false,
        borderColor: 'rgba(54, 162, 235, 0.8)',
        tension: 0.2,
      },
    ],
  };

  const chartReportes = {
    labels,
    datasets: [
      {
        label: 'Reportes creados por día (mes actual)',
        data: reportesPorDia,
        fill: false,
        borderColor: 'rgba(255, 99, 132, 0.8)',
        tension: 0.2,
      },
    ],
  };

  const opciones = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
      },
    },
  };

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-xl font-bold text-center mb-4">Usuarios Nuevos (Mensual)</h2>
        <Line data={chartUsuarios} options={opciones} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-center mb-4">Reportes Creados (Mensual)</h2>
        <Line data={chartReportes} options={opciones} />
      </div>
    </div>
  );
};

export default LineChartsMensuales;
