/**
 * Gamificação derivada do histórico de respostas de um par aluno + curso
 * (design D5) — nada é guardado como contador solto.
 */
import { CONFIG } from '../adaptativo/config';
import { calcularEstado, ordenarRespostas } from '../adaptativo/motor';
import { somarDias } from '../dominio/datas';
import type { Curso, Resposta } from '../dominio/tipos';

export type IdConquista = 'primeira-questao' | 'primeiro-topico' | 'sequencia-7' | 'curso-concluido';

export const CONQUISTAS: { id: IdConquista; nome: string; descricao: string }[] = [
  { id: 'primeira-questao', nome: 'Primeira questão', descricao: 'Respondeu a primeira questão do curso' },
  { id: 'primeiro-topico', nome: 'Primeiro tópico dominado', descricao: 'Dominou o primeiro tópico do curso' },
  { id: 'sequencia-7', nome: 'Sequência de 7 dias', descricao: 'Estudou o curso 7 dias seguidos' },
  { id: 'curso-concluido', nome: 'Curso concluído', descricao: 'Dominou todos os tópicos do curso' },
];

export interface ConquistaObtida {
  id: IdConquista;
  nome: string;
  /** Data em que foi conquistada. */
  data: string;
}

function doCurso(respostas: Resposta[], cursoId: string): Resposta[] {
  return respostas.filter((r) => r.cursoId === cursoId);
}

export function xpDaResposta(r: Pick<Resposta, 'acertou' | 'dificuldade'>): number {
  return r.acertou ? CONFIG.xp[r.dificuldade] : 0;
}

export function xpCurso(respostas: Resposta[], cursoId: string): number {
  return doCurso(respostas, cursoId).reduce((soma, r) => soma + xpDaResposta(r), 0);
}

/**
 * Dias consecutivos com ao menos uma resposta no curso, terminando hoje ou
 * ontem (o dia de hoje ainda não terminou). Um dia inteiro sem atividade zera.
 */
export function sequenciaDias(respostas: Resposta[], cursoId: string, hoje: string): number {
  const dias = new Set(doCurso(respostas, cursoId).map((r) => r.data));
  let dia = dias.has(hoje) ? hoje : somarDias(hoje, -1);
  let sequencia = 0;
  while (dias.has(dia)) {
    sequencia++;
    dia = somarDias(dia, -1);
  }
  return sequencia;
}

/** Conquistas do curso, cada uma no máximo uma vez, na ordem em que ocorreram. */
export function conquistasCurso(curso: Curso, respostas: Resposta[]): ConquistaObtida[] {
  const ordenadas = ordenarRespostas(doCurso(respostas, curso.id));
  const obtidas = new Map<IdConquista, string>();
  const conceder = (id: IdConquista, data: string) => {
    if (!obtidas.has(id)) obtidas.set(id, data);
  };

  let diaAnterior: string | undefined;
  let sequencia = 0;
  ordenadas.forEach((r, i) => {
    conceder('primeira-questao', r.data);

    if (r.data !== diaAnterior) {
      sequencia = diaAnterior && somarDias(diaAnterior, 1) === r.data ? sequencia + 1 : 1;
      diaAnterior = r.data;
      if (sequencia >= CONFIG.diasConquistaSequencia) conceder('sequencia-7', r.data);
    }

    const estado = calcularEstado(curso, ordenadas.slice(0, i + 1));
    if (estado.topicos.some((t) => t.dominado)) conceder('primeiro-topico', r.data);
    if (estado.concluido) conceder('curso-concluido', r.data);
  });

  return CONQUISTAS.filter((c) => obtidas.has(c.id)).map((c) => ({ id: c.id, nome: c.nome, data: obtidas.get(c.id)! }))
    .sort((a, b) => a.data.localeCompare(b.data));
}

export function novasConquistas(antes: ConquistaObtida[], depois: ConquistaObtida[]): ConquistaObtida[] {
  const ids = new Set(antes.map((c) => c.id));
  return depois.filter((c) => !ids.has(c.id));
}
