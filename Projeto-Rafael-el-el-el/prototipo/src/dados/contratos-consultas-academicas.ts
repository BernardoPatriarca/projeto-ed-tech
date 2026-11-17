import type {
  Disciplina, Funcao, Graduacao, NivelDisciplina, PeriodoLetivo, QuestaoDisciplina,
  StatusConteudo, Topico,
} from '../dominio/tipos';
import type { AlvoTurma } from './comandos-academicos';

export interface ConsultaAcademica<T> { revisao: number; dados: T }
export interface IdentidadePessoa { id: string; nome: string }
export interface CandidatoVinculo extends IdentidadePessoa { funcoes: Funcao[] }
export interface ContextoTurma {
  graduacao: Pick<Graduacao, 'id' | 'codigo' | 'nome'>;
  disciplina: Pick<Disciplina, 'id' | 'codigo' | 'nome' | 'nivel' | 'status'>;
  turma: { id: string; codigo: string };
  periodoLetivo: Pick<PeriodoLetivo, 'id' | 'nome'>;
}
export interface MinhaTurma extends ContextoTurma {
  matricula: { id: string; data: string };
  conteudoDisponivel: boolean;
}
export interface OfertaCatalogo extends ContextoTurma {
  professores: IdentidadePessoa[];
  acesso: { situacao: 'matriculado'; matriculaId: string } | { situacao: 'sem-matricula' };
}
export interface DisciplinaCatalogo {
  id: string; codigo: string; nome: string; descricaoCurta: string; nivel: NivelDisciplina;
  numeroTopicos: number;
  ofertas: OfertaCatalogo[];
}
export interface GraduacaoCatalogo {
  id: string; codigo: string; nome: string; descricaoCurta: string; area: string;
  disciplinas: DisciplinaCatalogo[];
}
export interface DetalheGraduacao {
  graduacao: Graduacao;
  disciplinas: DisciplinaCatalogo[];
}
export interface DetalheDisciplina {
  graduacao: Pick<Graduacao, 'id' | 'codigo' | 'nome'>;
  disciplina: Omit<DisciplinaCatalogo, 'ofertas'> & { descricao: string };
  topicos: Pick<Topico, 'id' | 'titulo'>[];
  ofertas: OfertaCatalogo[];
}
export interface FiltrosCatalogo { busca?: string; area?: string; nivel?: NivelDisciplina; periodoLetivoId?: string }
export interface DisciplinaAdministravel {
  id: string; graduacaoId: string; codigo: string; nome: string;
  descricaoCurta: string; descricao: string; nivel: NivelDisciplina; status: StatusConteudo;
}
export interface EstruturaAdministravel {
  graduacoes: Graduacao[];
  disciplinas: DisciplinaAdministravel[];
  turmas: (ContextoTurma & { professores: IdentidadePessoa[] })[];
  periodosLetivos: PeriodoLetivo[];
}
export interface MatriculadoTurma { matriculaId: string; data: string; aluno: IdentidadePessoa }
export type PedidoCandidatos =
  | { finalidade: 'matricula' | 'docencia'; turma: AlvoTurma }
  | { finalidade: 'coordenacao'; graduacaoId: string }
  | { finalidade: 'responsavel' | 'aluno-responsavel' };
export interface ConteudoEditavel {
  graduacao: Pick<Graduacao, 'id' | 'codigo' | 'nome'>;
  disciplina: DisciplinaAdministravel & { topicos: Topico[] };
  questoes: QuestaoDisciplina[];
}

/** Contratos futuros do grupo 5. Nenhuma consulta de 2.10 devolve estes resultados.
 * Valores devem vir das projeções reais; ausência de implementação não é zero ou Sem dados.
 * Médias são exatas; o arredondamento pertence à apresentação.
 */
export interface IndicadoresAlunoTurma {
  matriculaId: string;
  progresso: number;
  dominioPorTopico: { topicoId: string; dominio: number }[];
  taxaAcertos: number;
  xp: number;
}
export type MediasTurma =
  | { situacao: 'sem-dados' }
  | { situacao: 'calculadas'; progressoMedio: number; dominioMedioPorTopico: { topicoId: string; dominio: number }[] };
export interface IndicadoresDocenciaTurma {
  turmaId: string;
  matriculados: (IdentidadePessoa & IndicadoresAlunoTurma)[];
  medias: MediasTurma;
}
export interface IndicadoresCoordenacao {
  turmas: { turmaId: string; quantidadeMatriculados: number; medias: MediasTurma }[];
}
export interface IndicadoresResponsavel {
  alunoId: string;
  turmas: { turmaId: string; progresso: number; sequenciaDias: number; ultimaAtividade: string | null }[];
}
export interface IndicadoresAdministracao {
  pessoas: { total: number; porFuncao: Record<Funcao, number> };
  graduacoes: number;
  disciplinas: { rascunho: number; publicadas: number };
  periodosLetivos: number;
  turmas: number;
  matriculas: number;
}
