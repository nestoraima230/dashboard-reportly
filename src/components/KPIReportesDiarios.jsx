import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { getTodayRange, formatDayLabel } from '../../utils/dateUtils';

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

function getStartOfLastWeek(date) {
  const startOfThisWeek = getStartOfWeek(date);
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
  return startOfLastWeek;
}

function getEndOfLastWeek(date) {
  const startOfLastWeek = getStartOfLastWeek(date);
  const endOfLastWeek = new Date(startOfLastWeek);
  endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
  endOfLastWeek.setHours(23, 59, 59, 999);
  return endOfLastWeek;
}

const KPIReportesDiarios = ({ umbral = 40 }) => {
  const [reporteDiario, setReporteDiario] = useState(0);
  const [tendenciaSemanaPasada, setTendenciaSemanaPasada] = useState([]);
  const [tendenciaEstaSemana, setTendenciaEstaSemana] = useState([]);
  const [totalReportes, setTotalReportes] = useState(0);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const { start: todayStart, end: todayEnd } = getTodayRange();

    const semanaPasadaStart = getStartOfLastWeek(new Date());
    const semanaPasadaEnd = getEndOfLastWeek(new Date());

    const estaSemanaStart = getStartOfWeek(new Date());
    const estaSemanaEnd = getEndOfWeek(new Date());

    const countsSemanaPasada = {};
    for (let i = 0; i < 7; i++) {
      const day = new Date(semanaPasadaStart);
      day.setDate(semanaPasadaStart.getDate() + i);
      countsSemanaPasada[day.toDateString()] = 0;
    }

    const countsEstaSemana = {};
    for (let i = 0; i < 7; i++) {
      const day = new Date(estaSemanaStart);
      day.setDate(estaSemanaStart.getDate() + i);
      countsEstaSemana[day.toDateString()] = 0;
    }

    const unsubscribeReportes = onSnapshot(
      collection(db, 'reportes'),
      (snapshot) => {
        let countToday = 0;
        let totalCount = snapshot.size;

        snapshot.forEach((doc) => {
          const data = doc.data();
          const creadoEn = data.creadoEn?.toDate ? data.creadoEn.toDate() : null;

          if (creadoEn) {
            if (creadoEn >= todayStart && creadoEn <= todayEnd) {
              countToday++;
            }
            if (creadoEn >= semanaPasadaStart && creadoEn <= semanaPasadaEnd) {
              const dayStr = creadoEn.toDateString();
              if (countsSemanaPasada.hasOwnProperty(dayStr)) {
                countsSemanaPasada[dayStr]++;
              }
            }
            if (creadoEn >= estaSemanaStart && creadoEn <= estaSemanaEnd) {
              const dayStr = creadoEn.toDateString();
              if (countsEstaSemana.hasOwnProperty(dayStr)) {
                countsEstaSemana[dayStr]++;
              }
            }
          }
        });

        setReporteDiario(countToday);
        setTotalReportes(totalCount);

        const arraySemanaPasada = Object.entries(countsSemanaPasada).map(([dateStr, count]) => {
          const dateObj = new Date(dateStr);
          return {
            label: formatDayLabel(dateObj),
            count,
            isToday: dateStr === new Date().toDateString(),
          };
        });

        const arrayEstaSemana = Object.entries(countsEstaSemana).map(([dateStr, count]) => {
          const dateObj = new Date(dateStr);
          return {
            label: formatDayLabel(dateObj),
            count,
            isToday: dateStr === new Date().toDateString(),
          };
        });

        setTendenciaSemanaPasada(arraySemanaPasada);
        setTendenciaEstaSemana(arrayEstaSemana);
        setLoading(false);
      },
      (err) => {
        setError('Error al cargar reportes');
        setLoading(false);
        console.error(err);
      }
    );

    const unsubscribeUsuarios = onSnapshot(collection(db, 'usuarios'), (snapshot) => {
      setTotalUsuarios(snapshot.size);
    });

    return () => {
      unsubscribeReportes();
      unsubscribeUsuarios();
    };
  }, []);

  const getStatusColor = () => {
    if (loading) return 'bg-gray-200';
    if (error) return 'bg-orange-100 border-orange-500';
    return reporteDiario > umbral ? 'bg-red-100 border-red-500' : 'bg-green-100 border-green-500';
  };

  const renderTable = (title, tendencia) => (
    <>
      <h3 className="text-xl font-semibold text-center mb-4">{title}</h3>
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full table-auto text-left border-separate border-spacing-2">
          <thead className="bg-blue-100 text-sm">
            <tr>
              <th className="py-2 px-4 text-gray-700">Día</th>
              <th className="py-2 px-4 text-gray-700">Reportes</th>
              <th className="py-2 px-4 text-gray-700">Visualización</th>
            </tr>
          </thead>
          <tbody>
            {tendencia.map(({ label, count, isToday }) => (
              <tr
                key={label}
                className={`transition-all duration-300 hover:bg-blue-50 ${
                  isToday ? 'bg-blue-200' : 'bg-white'
                }`}
              >
                <td className="py-2 px-4">{label}</td>
                <td className="py-2 px-4 text-center">{count}</td>
                <td className="py-2 px-4">
                  <div className="w-full bg-gray-200 h-2 rounded-full">
                    <div
                      className={`h-2 rounded-full ${
                        count > umbral ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(count / 10) * 100}%` }}
                    ></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <div className={`p-6 rounded-lg border-2 ${getStatusColor()} transition-colors`}>
      <h2 className="text-2xl font-semibold mb-4 text-center">Reportes de Hoy</h2>

      {loading ? (
        <p className="text-gray-500 text-center">Cargando...</p>
      ) : error ? (
        <p className="text-orange-600 text-center font-medium">{error}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 text-center">
            <div>
              <p className="text-5xl font-extrabold text-gray-800">{reporteDiario}</p>
              <p className="text-lg text-gray-600 mt-2">
                Umbral: {umbral}
                {reporteDiario > umbral && (
                  <span className="ml-2 text-red-600 font-medium">¡Alerta!</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-5xl font-extrabold text-gray-800">{totalReportes}</p>
              <p className="text-lg text-gray-600 mt-2">Total de reportes</p>
            </div>
            <div>
              <p className="text-5xl font-extrabold text-gray-800">{totalUsuarios}</p>
              <p className="text-lg text-gray-600 mt-2">Total de usuarios</p>
            </div>
          </div>

          {renderTable('Tendencia semanal de reportes (Semana pasada)', tendenciaSemanaPasada)}
          {renderTable('Tendencia semanal de reportes (Esta semana)', tendenciaEstaSemana)}
        </>
      )}
    </div>
  );
};

export default KPIReportesDiarios;