/** Utilitários de data no formato AAAA-MM-DD, sempre em UTC para evitar efeitos de fuso. */

export function somarDias(data: string, dias: number): string {
  const d = new Date(`${data}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function formatarData(data: string): string {
  const [a, m, d] = data.split('-');
  return `${d}/${m}/${a}`;
}
