import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea un objeto Date al formato Firestore esperado:
 * "6 de junio de 2025"
 */
export function formatFirestoreDate(date) {
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
}

/**
 * Obtiene la fecha de hoy formateada para Firestore
 */
export function getTodayFirestoreFormat() {
  return formatFirestoreDate(new Date());
}

/**
 * Parsea un string con formato Firestore a un objeto Date.
 * Retorna un objeto Date válido o Invalid Date si no pudo parsear.
 */
export function parseFirestoreDate(dateStr) {
  if (!dateStr) return null;

  // Extraer solo la parte de la fecha sin hora (antes de la coma)
  const datePart = dateStr.split(',')[0]; // "6 de junio de 2025"

  const parsed = parse(datePart.trim(), "d 'de' MMMM 'de' yyyy", new Date(), { locale: es });

  return isNaN(parsed) ? null : parsed;
}

/**
 * Verifica si la fecha Firestore dada es la de hoy
 */
export function isTodayFirestoreDate(dateStr) {
  const date = parseFirestoreDate(dateStr);
  if (!date) return false;
  const todayStr = getTodayFirestoreFormat();
  const formattedDateStr = formatFirestoreDate(date);
  return formattedDateStr === todayStr;
}

/**
 * Retorna el rango de fechas (Date objects) para la semana actual
 * (Lunes a Domingo)
 */
export function getWeekRange() {
  const today = new Date();

  // Obtener el primer día de la semana (lunes)
  const dayOfWeek = today.getDay(); // domingo=0, lunes=1, ..., sábado=6
  const diffToMonday = (dayOfWeek + 6) % 7; // días desde lunes

  // Fecha inicio lunes 00:00:00 local
  const start = new Date(today);
  start.setDate(today.getDate() - diffToMonday);
  start.setHours(0, 0, 0, 0);

  // Fecha fin domingo 23:59:59 local
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Retorna el rango de fechas (Date objects) para el día de hoy
 */
export function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function formatDayLabel(date) {
  // Usa date-fns si quieres, o date.toLocaleDateString en español
  return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
}