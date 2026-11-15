export type Perfil = 'aluno' | 'professor' | 'admin' | 'responsavel';

export const PERFIS: Perfil[] = ['aluno', 'professor', 'admin', 'responsavel'];

export const NOME_PERFIL: Record<Perfil, string> = {
  aluno: 'Aluno',
  professor: 'Professor',
  admin: 'Administrador',
  responsavel: 'Responsável',
};

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
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

export interface Matricula {
  id: string;
  alunoId: string;
  cursoId: string;
  /** Data (AAAA-MM-DD) da matrícula. */
  data: string;
}

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

export interface VinculoProfessor {
  professorId: string;
  cursoId: string;
}

export interface Dados {
  versaoSeed: number;
  dataVirtual: string;
  usuarios: Usuario[];
  cursos: Curso[];
  questoes: Questao[];
  matriculas: Matricula[];
  respostas: Resposta[];
  vinculosResponsavel: VinculoResponsavel[];
  vinculosProfessor: VinculoProfessor[];
}
