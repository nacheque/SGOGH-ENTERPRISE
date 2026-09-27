function unidades(num: number): string {
  switch (num) {
    case 1: return 'UN';
    case 2: return 'DOS';
    case 3: return 'TRES';
    case 4: return 'CUATRO';
    case 5: return 'CINCO';
    case 6: return 'SEIS';
    case 7: return 'SIETE';
    case 8: return 'OCHO';
    case 9: return 'NUEVE';
    default: return '';
  }
}

function decenasYUnidades(num: number): string {
  if (num < 10) return unidades(num);
  if (num === 10) return 'DIEZ';
  if (num === 11) return 'ONCE';
  if (num === 12) return 'DOCE';
  if (num === 13) return 'TRECE';
  if (num === 14) return 'CATORCE';
  if (num === 15) return 'QUINCE';
  if (num < 20) return `DIECI${unidades(num - 10)}`;
  if (num === 20) return 'VEINTE';
  if (num < 30) return `VEINTI${unidades(num - 20)}`;

  const decena = Math.floor(num / 10);
  const unidad = num % 10;
  const decTexto = [
    '', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA',
    'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'
  ][decena];

  return unidad === 0 ? decTexto : `${decTexto} Y ${unidades(unidad)}`;
}

function centenas(num: number): string {
  if (num === 100) return 'CIEN';
  if (num < 100) return decenasYUnidades(num);

  const cent = Math.floor(num / 100);
  const resto = num % 100;
  const centTexto = [
    '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS',
    'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'
  ][cent];

  return resto === 0 ? centTexto : `${centTexto} ${decenasYUnidades(resto)}`;
}

function miles(num: number): string {
  if (num < 1000) return centenas(num);
  const m = Math.floor(num / 1000);
  const resto = num % 1000;

  const mTexto = m === 1 ? 'MIL' : `${centenas(m)} MIL`;
  return resto === 0 ? mTexto : `${mTexto} ${centenas(resto)}`;
}

export function numeroALetras(monto: number): string {
  if (isNaN(monto) || monto === 0) return 'CERO';

  const entero = Math.floor(Math.abs(monto));

  if (entero < 1000000) {
    return miles(entero);
  }

  const millones = Math.floor(entero / 1000000);
  const resto = entero % 1000000;

  const millonTexto = millones === 1 ? 'UN MILLÓN' : `${miles(millones)} MILLONES`;
  return resto === 0 ? millonTexto : `${millonTexto} ${miles(resto)}`;
}