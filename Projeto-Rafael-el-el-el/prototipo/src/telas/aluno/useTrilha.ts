import { calcularEstado, type EstadoTrilha } from '../../adaptativo/motor';
import { useApp, useUsuario } from '../../app/contexto';
import { respostasDe } from '../../desempenho/indicadores';
import type { Curso, Resposta } from '../../dominio/tipos';

export interface Trilha {
  curso: Curso;
  respostas: Resposta[];
  estado: EstadoTrilha;
}

/** Dados da trilha do aluno atual no curso, ou null se o curso não existe ou não há matrícula. */
export function useTrilha(cursoId: string | undefined): Trilha | null {
  const { dados } = useApp();
  const usuario = useUsuario();
  const curso = dados.cursos.find((c) => c.id === cursoId);
  const matriculado = dados.matriculas.some((m) => m.alunoId === usuario.id && m.cursoId === cursoId);
  if (!curso || !matriculado) return null;
  const respostas = respostasDe(dados, usuario.id, curso.id);
  return { curso, respostas, estado: calcularEstado(curso, respostas) };
}
