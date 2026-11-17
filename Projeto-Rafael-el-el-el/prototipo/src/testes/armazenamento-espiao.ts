/** Armazenamento em memória que registra toda escrita e pode falhar em uma chave; nunca toca o localStorage. */
export function criarArmazenamentoEspiao(inicial: Record<string, string> = {}, falharEscritaEm?: string) {
  const mapa = new Map(Object.entries(inicial));
  const chamadas: string[] = [];
  return {
    getItem: (k: string) => mapa.get(k) ?? null,
    setItem: (k: string, v: string) => {
      chamadas.push(`set:${k}`);
      if (k === falharEscritaEm) throw new Error('QuotaExceededError');
      mapa.set(k, v);
    },
    removeItem: (k: string) => { chamadas.push(`remove:${k}`); mapa.delete(k); },
    chamadas,
    /** Retrato completo de todas as chaves e valores. */
    retrato: () => Object.fromEntries([...mapa.entries()].sort()),
  };
}
