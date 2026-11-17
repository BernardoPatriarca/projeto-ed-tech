import { ConsultasAcademicas } from '../dados/consultas-academicas';
import type { DadosAcademicos } from '../dominio/tipos';
import { ambienteComandos, prepararConteudoPublicado } from './ambiente-comandos-academicos';

/**
 * Cenário de estudo sem respostas: d-alg publicada (tp-1/tp-2, 3 questões cada), Ana (m-ana-26, m-ana-27),
 * Bruno (m-bruno-26, turma A) e turma paralela t-b sem matrículas. Carla leciona t-26 (SI).
 */
export function prepararEstudo(dados: DadosAcademicos) {
  prepararConteudoPublicado(dados);
  dados.usuarios.push(
    { id: 'u-bruno', nome: 'Bruno', email: 'bruno@exemplo.com', ativo: true, funcoes: ['aluno'] },
    { id: 'u-prof2', nome: 'Professor de t-b', email: 'prof2@exemplo.com', ativo: true, funcoes: ['professor'] },
  );
  dados.turmas.push({ id: 't-b', codigo: 'B', disciplinaId: 'd-alg', periodoLetivoId: 'p-26' });
  dados.matriculas.push({ id: 'm-bruno-26', alunoId: 'u-bruno', turmaId: 't-26', data: dados.dataVirtual });
  dados.vinculosProfessor.push({ professorId: 'u-prof2', turmaId: 't-b' });
}

export function ambienteEstudo(preparar?: (dados: DadosAcademicos) => void) {
  const a = ambienteComandos((dados) => { prepararEstudo(dados); preparar?.(dados); });
  const repo = new ConsultasAcademicas(a.persistencia, a.sessao, a.gerarId);
  return { ...a, repo };
}

/** Id da questão do tópico e dificuldade dados na disciplina d-alg. */
export const questao = (topico: 'tp-1' | 'tp-2', dificuldade: 'facil' | 'medio' | 'dificil') => `d-alg-${topico}-${dificuldade}`;
