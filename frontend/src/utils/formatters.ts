/**
 * Convierte valores numéricos a formato moneda de curso legal (ARS).
 * Ejemplo: 19687.5 -> "$ 19.687,50"
 */
export const formatCurrencyAR = (value: number | string | null | undefined): string => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : Number(value || 0);
  if (isNaN(numericValue)) return '$ 0,00';

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
};

/**
 * Formatea cadenas de fechas a notación estándar argentina (DD/MM/AAAA).
 * Acepta formatos ISO o YYYY-MM-DD sin desfasajes de zona horaria.
 * Ejemplo: "2026-09-10" -> "10/09/2026"
 */
export const formatDateAR = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';

  // Si viene en formato YYYY-MM-DD o con timestamp ISO
  const cleanDate = dateStr.split('T')[0];
  const parts = cleanDate.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';

  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Formatea un número porcentual a formato de visualización estándar.
 * Ejemplo: 5 -> "+5.00%" o "0.00%"
 */
export const formatPercentageAR = (value: number | string | null | undefined): string => {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value || 0);
  if (isNaN(num)) return '0.00%';
  const prefix = num > 0 ? '+' : '';
  return `${prefix}${num.toFixed(2)}%`;
};