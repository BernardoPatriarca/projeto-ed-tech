/** Regras de conteúdo de curso: validações, publicação e permissão de edição. */
import { DIFICULDADES, type Curso, type Dificuldade, type Questao, type UsuarioLegado as Usuario, type VinculoProfessorLegado as VinculoProfessor } from '../dominio/tipos';

export interface FaltanteTopico {
  topicoId: string;
  titulo: string;
  niveis: Dificuldade[];
}

export interface VerificacaoPublicacao {
  ok: boolean;
  semTopicos: boolean;
  faltantes: FaltanteTopico[];
}

/** Cada tópico precisa de ao menos uma questão de cada nível de dificuldade. */
export function verificarPublicacao(curso: Curso, questoes: Questao[]): VerificacaoPublicacao {
  const faltantes: FaltanteTopico[] = [];
  for (const t of curso.topicos) {
    const niveis = DIFICULDADES.filter(
      (d) => !questoes.some((q) => q.cursoId === curso.id && q.topicoId === t.id && q.dificuldade === d),
    );
    if (niveis.length > 0) faltantes.push({ topicoId: t.id, titulo: t.titulo, niveis });
  }
  const semTopicos = curso.topicos.length === 0;
  return { ok: !semTopicos && faltantes.length === 0, semTopicos, faltantes };
}

export interface DadosCursoForm {
  titulo: string;
  descricao: string;
  area: string;
  nivel: string;
}

export function validarCurso(dados: DadosCursoForm): Partial<Record<keyof DadosCursoForm, string>> {
  const erros: Partial<Record<keyof DadosCursoForm, string>> = {};
  if (!dados.titulo.trim()) erros.titulo = 'Informe o título do curso.';
  if (!dados.area.trim()) erros.area = 'Informe a área do curso.';
  return erros;
}

export interface QuestaoForm {
  enunciado: string;
  alternativas: string[];
  correta: number | null;
  explicacao: string;
}

export function validarQuestao(q: QuestaoForm): string[] {
  const erros: string[] = [];
  if (!q.enunciado.trim()) erros.push('Informe o enunciado.');
  const preenchidas = q.alternativas.filter((a) => a.trim()).length;
  if (preenchidas < 2) erros.push('Informe ao menos duas alternativas.');
  if (q.correta === null || !q.alternativas[q.correta]?.trim()) {
    erros.push('É preciso marcar uma alternativa correta.');
  }
  if (!q.explicacao.trim()) erros.push('Informe a explicação.');
  return erros;
}

/** Professor edita apenas cursos vinculados; Administrador edita todos. */
export function podeEditarCurso(usuario: Usuario, cursoId: string, vinculos: VinculoProfessor[]): boolean {
  if (usuario.perfil === 'admin') return true;
  if (usuario.perfil !== 'professor') return false;
  return vinculos.some((v) => v.professorId === usuario.id && v.cursoId === cursoId);
}
