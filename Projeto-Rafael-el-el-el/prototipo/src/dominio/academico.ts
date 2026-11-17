import type {
  Disciplina, Graduacao, Matricula, PeriodoLetivo, Turma,
  VinculoCoordenador, VinculoProfessor, VinculoResponsavel,
} from './tipos';

/** Validação estrutural pura. Autorização e persistência pertencem ao repositório. */
export type ErrosAcademicos = Record<string, string>;

export function validarGraduacao(
  graduacao: Graduacao,
  existentes: readonly Graduacao[],
): ErrosAcademicos {
  const erros: ErrosAcademicos = {};
  if (!graduacao.codigo.trim()) erros.codigo = 'Informe o código da graduação.';
  if (!graduacao.nome.trim()) erros.nome = 'Informe o nome da graduação.';
  if (existentes.some((g) => g.id !== graduacao.id && g.codigo === graduacao.codigo)) {
    erros.codigo = 'O código já pertence a outra graduação.';
  }
  return erros;
}

/** Composição inicial; não gera IDs, não publica conteúdo e não grava dados. */
export function criarDisciplina(dados: Omit<Disciplina, 'status' | 'topicos'>): Disciplina {
  return { ...dados, status: 'rascunho', topicos: [] };
}

export function validarDisciplina(
  disciplina: Disciplina,
  graduacoes: readonly Graduacao[],
  existentes: readonly Disciplina[],
): ErrosAcademicos {
  const erros: ErrosAcademicos = {};
  if (!disciplina.codigo.trim()) erros.codigo = 'Informe o código da disciplina.';
  if (!disciplina.nome.trim()) erros.nome = 'Informe o nome da disciplina.';
  if (!graduacoes.some((g) => g.id === disciplina.graduacaoId)) {
    erros.graduacaoId = 'Informe uma graduação existente.';
  }
  if (existentes.some((d) => d.id !== disciplina.id
    && d.graduacaoId === disciplina.graduacaoId && d.codigo === disciplina.codigo)) {
    erros.codigo = 'O código já pertence a outra disciplina desta graduação.';
  }
  return erros;
}

function dataCivilValida(data: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const instante = new Date(`${data}T00:00:00Z`);
  return !Number.isNaN(instante.getTime()) && instante.toISOString().slice(0, 10) === data;
}

export function validarPeriodoLetivo(periodo: PeriodoLetivo): ErrosAcademicos {
  const erros: ErrosAcademicos = {};
  if (!periodo.id.trim()) erros.id = 'Informe o identificador do período.';
  if (!periodo.nome.trim()) erros.nome = 'Informe o nome do período.';
  if (!dataCivilValida(periodo.dataInicio)) erros.dataInicio = 'Informe uma data de início válida.';
  if (!dataCivilValida(periodo.dataFim)) erros.dataFim = 'Informe uma data de fim válida.';
  if (!erros.dataInicio && !erros.dataFim && periodo.dataFim < periodo.dataInicio) {
    erros.dataFim = 'A data de fim não pode ser anterior ao início.';
  }
  return erros;
}

export function validarTurma(
  turma: Turma,
  disciplinas: readonly Disciplina[],
  periodos: readonly PeriodoLetivo[],
  existentes: readonly Turma[],
): ErrosAcademicos {
  const erros: ErrosAcademicos = {};
  if (!turma.codigo.trim()) erros.codigo = 'Informe o código da turma.';
  if (!disciplinas.some((d) => d.id === turma.disciplinaId)) {
    erros.disciplinaId = 'Informe uma disciplina existente.';
  }
  if (!periodos.some((p) => p.id === turma.periodoLetivoId)) {
    erros.periodoLetivoId = 'Informe um período letivo existente.';
  }
  if (existentes.some((t) => t.id !== turma.id && t.codigo === turma.codigo
    && t.disciplinaId === turma.disciplinaId && t.periodoLetivoId === turma.periodoLetivoId)) {
    erros.codigo = 'O código já pertence a outra turma da disciplina neste período.';
  }
  return erros;
}

type Referencia = { id: string };

/** Duplicidade devolve o registro original para o futuro comando ser idempotente.
 * Valida relações estruturais, inclusive em históricos de pessoas hoje inativas.
 * Função/atividade na atribuição e autorização do autor serão verificadas no grupo 2.
 */
export interface ValidacaoRelacionamento<T> {
  erros: ErrosAcademicos;
  existente: T | undefined;
}

function validarReferencias(
  referencias: readonly [campo: string, id: string, entidades: readonly Referencia[]][],
): ErrosAcademicos {
  const erros: ErrosAcademicos = {};
  for (const [campo, id, entidades] of referencias) {
    if (!entidades.some((entidade) => entidade.id === id)) erros[campo] = 'Referência inexistente.';
  }
  return erros;
}

export function validarMatricula(
  matricula: Matricula,
  usuarios: readonly Referencia[],
  turmas: readonly Turma[],
  existentes: readonly Matricula[],
): ValidacaoRelacionamento<Matricula> {
  return {
    erros: validarReferencias([['alunoId', matricula.alunoId, usuarios], ['turmaId', matricula.turmaId, turmas]]),
    existente: existentes.find((m) => m.alunoId === matricula.alunoId && m.turmaId === matricula.turmaId),
  };
}

export function validarVinculoProfessor(
  vinculo: VinculoProfessor,
  usuarios: readonly Referencia[],
  turmas: readonly Turma[],
  existentes: readonly VinculoProfessor[],
): ValidacaoRelacionamento<VinculoProfessor> {
  return {
    erros: validarReferencias([['professorId', vinculo.professorId, usuarios], ['turmaId', vinculo.turmaId, turmas]]),
    existente: existentes.find((v) => v.professorId === vinculo.professorId && v.turmaId === vinculo.turmaId),
  };
}

export function validarVinculoCoordenador(
  vinculo: VinculoCoordenador,
  usuarios: readonly Referencia[],
  graduacoes: readonly Graduacao[],
  existentes: readonly VinculoCoordenador[],
): ValidacaoRelacionamento<VinculoCoordenador> {
  return {
    erros: validarReferencias([['coordenadorId', vinculo.coordenadorId, usuarios], ['graduacaoId', vinculo.graduacaoId, graduacoes]]),
    existente: existentes.find((v) => v.coordenadorId === vinculo.coordenadorId && v.graduacaoId === vinculo.graduacaoId),
  };
}

export function validarVinculoResponsavel(
  vinculo: VinculoResponsavel,
  usuarios: readonly Referencia[],
  existentes: readonly VinculoResponsavel[],
): ValidacaoRelacionamento<VinculoResponsavel> {
  return {
    erros: validarReferencias([['responsavelId', vinculo.responsavelId, usuarios], ['alunoId', vinculo.alunoId, usuarios]]),
    existente: existentes.find((v) => v.responsavelId === vinculo.responsavelId && v.alunoId === vinculo.alunoId),
  };
}
