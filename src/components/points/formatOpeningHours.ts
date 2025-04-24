// Utilitário para exibir OpeningHours de forma amigável
// OpeningHours: { [day: string]: { open: string; close: string } }

const WEEKDAYS_PT = [
  'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'
];
const WEEKDAYS_KEYS = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

export function formatOpeningHours(openingHours: any): string {
  if (!openingHours || typeof openingHours !== 'object') return '';

  let allSame = true;
  let firstRange = '';
  const lines: string[] = [];

  for (let i = 0; i < 7; i++) {
    const dayKey = WEEKDAYS_KEYS[i];
    const dayLabel = WEEKDAYS_PT[i];
    const info = openingHours[dayKey];
    let range = 'Fechado';
    if (info && info.open && info.close) {
      if (info.open === info.close) {
        range = 'Fechado';
      } else {
        range = `${info.open}-${info.close}`;
      }
    }
    if (i === 0) firstRange = range;
    else if (range !== firstRange) allSame = false;
    lines.push(`${dayLabel}: ${range}`);
  }

  if (allSame) {
    return `Todos os dias: ${firstRange}`;
  }
  return lines.join('\n');
}
