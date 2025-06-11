// services/reporteService.js
import { db } from '../firebase/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { getTodayDate } from '../utils/dateUtils';

export const guardarReporte = async ({ descripcion, etiquetas, ubicacion }) => {
  await addDoc(collection(db, 'reportes'), {
    descripcion,
    etiquetas,
    ubicacion,
    fecha: getTodayDate(), // "2025-06-06"
    hora: new Date().toLocaleTimeString('es-MX', { hour12: false })
  });
};
