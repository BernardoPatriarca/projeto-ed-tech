/** Indicadores de desempenho usados nos painéis de aluno, professor e responsável. */
import { CONFIG } from '../adaptativo/config';
import { calcularEstado, ordenarRespostas } from '../adaptativo/motor';
import type { Curso, Dados, Resposta } from '../dominio/tipos';

export interface TaxaAcertos {
  acertos: number;
  total: number;
  /** Porcentagem arredondada (0–100). */
  taxa: number;
}

export function taxaAcertos(respostas: Resposta[]): TaxaAcertos {
  const total = respostas.length;
  const acertos = respostas.filter((r) => r.acertou).length;
  return { acertos, total, taxa: total === 0 ? 0 : Math.round((acertos / total) * 100) };
}

/** Destaque "precisa de atenção": < 50% de acertos nas últimas 10 respostas do curso. */
export function precisaDeAtencao(respostasDoCurso: Resposta[]): boolean {
  const ultimas = ordenarRespostas(respostasDoCurso).slice(-CONFIG.atencao.ultimasRespostas);
  if (ultimas.length === 0) return false;
  return ultimas.filter((r) => r.acertou).length / ultimas.length < CONFIG.atencao.taxaMinima;
}

export function ultimaAtividade(respostas: Resposta[]): string | null {
  return respostas.reduce<string | null>((max, r) => (max === null || r.data > max ? r.data : max), null);
}

export function respostasDe(dados: Dados, alunoId: string, cursoId: string): Resposta[] {
  return dados.respostas.filter((r) => r.alunoId === alunoId && r.cursoId === cursoId);
}

export function dominioMedioPorTopico(
  curso: Curso,
  respostasPorAluno: Resposta[][],
): { topicoId: string; titulo: string; media: number }[] {
  const estados = respostasPorAluno.map((rs) => calcularEstado(curso, rs));
  return curso.topicos.map((t, i) => ({
    topicoId: t.id,
    titulo: t.titulo,
    media:
      estados.length === 0 ? 0 : Math.round(estados.reduce((s, e) => s + e.topicos[i].dominio, 0) / estados.length),
  }));
}
