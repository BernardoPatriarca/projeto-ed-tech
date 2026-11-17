/** @deprecated Somente para a demonstração antiga, ainda sem migração de dados/telas. */
export type Perfil = 'aluno' | 'professor' | 'admin' | 'responsavel';

export const PERFIS: Perfil[] = ['aluno', 'professor', 'admin', 'responsavel'];

export const NOME_PERFIL: Record<Perfil, string> = {
  aluno: 'Aluno',
  professor: 'Professor',
  admin: 'Administrador',
  responsavel: 'Responsável',
};

/** @deprecated Formato persistido anterior. Não usar nos novos contratos acadêmicos. */
export interface UsuarioLegado {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
}

export const FUNCOES = ['aluno', 'professor', 'coordenador', 'admin', 'responsavel'] as const;
export type Funcao = typeof FUNCOES[number];

export const NOME_FUNCAO: Record<Funcao, string> = {
  aluno: 'Aluno',
  professor: 'Professor',
  coordenador: 'Coordenador',
  admin: 'Administrador',
  responsavel: 'Responsável',
};

/** Uma identidade e funções atribuídas explicitamente, sem perfil principal. */
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  funcoes: Funcao[];
  ativo: boolean;
}

export type Dificuldade = 'facil' | 'medio' | 'dificil';

export const DIFICULDADES: Dificuldade[] = ['facil', 'medio', 'dificil'];

export const NOME_DIFICULDADE: Record<Dificuldade, string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
};

export type NivelCurso = 'Iniciante' | 'Intermediário' | 'Avançado';
export const NIVEIS_CURSO: NivelCurso[] = ['Iniciante', 'Intermediário', 'Avançado'];

export type StatusCurso = 'rascunho' | 'publicado';

export type TipoMaterial = 'texto' | 'video' | 'arquivo';

export interface Material {
  id: string;
  tipo: TipoMaterial;
  titulo: string;
  /** Texto do material ou URL (vídeo/arquivo). */
  conteudo: string;
}

export interface Topico {
  id: string;
  titulo: string;
  materiais: Material[];
}

/** @deprecated Unidade de conteúdo legada; não representa uma graduação. */
export interface Curso {
  id: string;
  titulo: string;
  descricaoCurta: string;
  descricao: string;
  area: string;
  nivel: NivelCurso;
  status: StatusCurso;
  /** A ordem do array define a sequência de desbloqueio. */
  topicos: Topico[];
}

/** @deprecated Questão por curso legado. Novos contratos usam QuestaoDisciplina. */
export interface Questao {
  id: string;
  cursoId: string;
  topicoId: string;
  enunciado: string;
  alternativas: string[];
  /** Índice da alternativa correta. */
  correta: number;
  explicacao: string;
  dificuldade: Dificuldade;
}

/** @deprecated Persistência aluno–curso da demonstração anterior; não migrar implicitamente. */
export interface MatriculaLegada {
  id: string;
  alunoId: string;
  cursoId: string;
  /** Data (AAAA-MM-DD) da matrícula. */
  data: string;
}

/** @deprecated Histórico aluno–curso; não converter automaticamente em matrícula acadêmica. */
export interface Resposta {
  id: string;
  alunoId: string;
  cursoId: string;
  topicoId: string;
  questaoId: string;
  dificuldade: Dificuldade;
  alternativa: number;
  acertou: boolean;
  /** Data virtual (AAAA-MM-DD) da resposta. */
  data: string;
  /** Ordem global crescente das respostas. */
  momento: number;
}

export interface VinculoResponsavel {
  responsavelId: string;
  alunoId: string;
}

/** @deprecated Vínculo docente por curso do protótipo anterior. */
export interface VinculoProfessorLegado {
  professorId: string;
  cursoId: string;
}

/** @deprecated Documento anterior, mantido intacto até a substituição informada do grupo 6. */
export interface Dados {
  versaoSeed: number;
  dataVirtual: string;
  usuarios: UsuarioLegado[];
  cursos: Curso[];
  questoes: Questao[];
  matriculas: MatriculaLegada[];
  respostas: Resposta[];
  vinculosResponsavel: VinculoResponsavel[];
  vinculosProfessor: VinculoProfessorLegado[];
}

/** Cadastro acadêmico de uma graduação; não é uma unidade de conteúdo. */
export interface Graduacao {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  area: string;
}

export type NivelDisciplina = NivelCurso;
export type StatusConteudo = StatusCurso;

/** Conteúdo compartilhado pelas ofertas de uma disciplina de uma graduação. */
export interface Disciplina {
  id: string;
  graduacaoId: string;
  codigo: string;
  nome: string;
  descricaoCurta: string;
  descricao: string;
  nivel: NivelDisciplina;
  status: StatusConteudo;
  /** IDs estáveis; a posição determina a ordem pedagógica. */
  topicos: Topico[];
}

export interface PeriodoLetivo {
  id: string;
  nome: string;
  /** Datas civis no formato AAAA-MM-DD. Não são semestre curricular ou nível. */
  dataInicio: string;
  dataFim: string;
}

/** Oferta identificada independentemente do nome/código editável da turma. */
export interface Turma {
  id: string;
  codigo: string;
  disciplinaId: string;
  periodoLetivoId: string;
}

/** Par aluno–turma único. O ID não muda ao renomear qualquer entidade associada. */
export interface Matricula {
  id: string;
  alunoId: string;
  turmaId: string;
  data: string;
}

/** Par professor–turma único; não atribui funções à pessoa. */
export interface VinculoProfessor {
  professorId: string;
  turmaId: string;
}

/** Par coordenador–graduação único; não representa vínculo docente. */
export interface VinculoCoordenador {
  coordenadorId: string;
  graduacaoId: string;
}

/** Declaração de conteúdo acadêmico; validação de questões será implementada no grupo 4. */
export interface QuestaoDisciplina extends Omit<Questao, 'cursoId'> {
  disciplinaId: string;
  revisao: number;
}

/** Contrato da cópia histórica. Registro/reconstituição imutáveis são trabalho do grupo 3. */
export interface RespostaAcademica {
  readonly id: string;
  readonly matriculaId: string;
  readonly topicoId: string;
  readonly questaoId: string;
  readonly alternativa: number;
  readonly acertou: boolean;
  readonly dificuldade: Dificuldade;
  readonly variacaoDominio: number;
  readonly xpConcedido: number;
  readonly versaoRegras: number;
  readonly data: string;
  readonly momento: number;
  readonly conteudoOriginal: Readonly<{
    enunciado: string;
    alternativas: readonly string[];
    correta: number;
    explicacao: string;
  }>;
}

/** Contrato de revisão; não autoriza nem confirma edições por si só (grupo 4). */
export interface RevisaoTextual {
  id: string;
  autorId: string;
  data: string;
  recursoId: string;
  revisaoOriginal: number;
  diferenca: {
    campo: 'enunciado' | 'alternativas' | 'explicacao' | 'titulo';
    original: string | readonly string[];
    proposto: string | readonly string[];
  }[];
  confirmada: true;
}

export const VERSAO_SCHEMA_ACADEMICO = 1;

/** Documento exclusivamente acadêmico. Sua declaração não inicializa localStorage. */
export interface DadosAcademicos {
  versaoSchema: number;
  versaoSeed: number;
  revisao: number;
  dataVirtual: string;
  usuarios: Usuario[];
  graduacoes: Graduacao[];
  disciplinas: Disciplina[];
  periodosLetivos: PeriodoLetivo[];
  turmas: Turma[];
  matriculas: Matricula[];
  questoes: QuestaoDisciplina[];
  respostas: RespostaAcademica[];
  vinculosProfessor: VinculoProfessor[];
  vinculosCoordenador: VinculoCoordenador[];
  vinculosResponsavel: VinculoResponsavel[];
  revisoesTextuais: RevisaoTextual[];
}
