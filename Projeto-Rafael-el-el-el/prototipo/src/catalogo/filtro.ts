import type { Curso } from '../dominio/tipos';

export interface FiltroCatalogo {
  texto: string;
  area: string;
  nivel: string;
}

const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/** Somente cursos publicados; busca no título (sem diferenciar acentos/maiúsculas) e filtros exatos. */
export function filtrarCatalogo(cursos: Curso[], filtro: FiltroCatalogo): Curso[] {
  const texto = normalizar(filtro.texto);
  return cursos.filter(
    (c) =>
      c.status === 'publicado' &&
      (!texto || normalizar(c.titulo).includes(texto)) &&
      (!filtro.area || c.area === filtro.area) &&
      (!filtro.nivel || c.nivel === filtro.nivel),
  );
}

export function opcoesCatalogo(cursos: Curso[]): { areas: string[]; niveis: string[] } {
  const publicados = cursos.filter((c) => c.status === 'publicado');
  return {
    areas: [...new Set(publicados.map((c) => c.area))].sort(),
    niveis: [...new Set(publicados.map((c) => c.nivel))],
  };
}
