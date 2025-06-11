import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

// Función para obtener inicio de día (00:00:00)
function getStartOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Función para obtener fin de día (23:59:59.999)
function getEndOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

// Función para obtener array con los días de la semana actual (lunes a domingo)
function getCurrentWeekDates() {
  const today = new Date();
  const day = today.getDay(); // domingo=0, lunes=1, ...
  const diffToMonday = (day + 6) % 7; // ajuste para lunes

  const monday = new Date(today);
  monday.setDate(today.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

// Formatear día a string tipo "Lunes 7 jun"
function formatDayLabel(date) {
  return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
}

const TendenciaSemanalReportes = () => {
  const [conteoPorDia, setConteoPorDia] = useState({}); // { '2025-06-07': 10, ... }

  useEffect(() => {
    const weekDates = getCurrentWeekDates();

    const unsubscribe = onSnapshot(collection(db, 'reportes'), (snapshot) => {
      // Inicializar conteo con 0 para cada día de la semana
      const conteo = {};
      weekDates.forEach(d => {
        const key = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
        conteo[key] = 0;
      });

      snapshot.forEach(doc => {
        const data = doc.data();
        const creadoEn = data.creadoEn;
        if (!creadoEn) return;

        const fecha = creadoEn.toDate();
        const fechaStr = fecha.toISOString().slice(0, 10);

        if (conteo.hasOwnProperty(fechaStr)) {
          conteo[fechaStr]++;
        }
      });

      setConteoPorDia(conteo);
    });

    return () => unsubscribe();
  }, []);

  const weekDates = getCurrentWeekDates();

  return (
    <div style={{ marginTop: 30 }}>
      <h2>Tendencia semanal de reportes (total por día)</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Día</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Reportes</th>
          </tr>
        </thead>
        <tbody>
          {weekDates.map(date => {
            const key = date.toISOString().slice(0, 10);
            return (
              <tr key={key}>
                <td style={{ border: '1px solid #ddd', padding: '8px', textTransform: 'capitalize' }}>
                  {formatDayLabel(date)}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                  {conteoPorDia[key] || 0}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TendenciaSemanalReportes;
