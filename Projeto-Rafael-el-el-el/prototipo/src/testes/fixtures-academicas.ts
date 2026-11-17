import { criarDisciplina } from '../dominio/academico';
import { VERSAO_SCHEMA_ACADEMICO, type DadosAcademicos } from '../dominio/tipos';

/** Fixture pequena e nova a cada chamada. Não importa o seed nem usa armazenamento. */
export function criarFixtureAcademica(): DadosAcademicos {
  return {
    versaoSchema: VERSAO_SCHEMA_ACADEMICO,
    versaoSeed: 1,
    revisao: 0,
    dataVirtual: '2026-11-17',
    usuarios: [
      { id: 'u-ana', nome: 'Ana', email: 'ana@exemplo.com', ativo: true, funcoes: ['aluno'] },
      { id: 'u-carla', nome: 'Carla', email: 'carla@exemplo.com', ativo: true, funcoes: ['professor', 'coordenador'] },
      { id: 'u-helena', nome: 'Helena', email: 'helena@exemplo.com', ativo: true, funcoes: ['responsavel'] },
    ],
    graduacoes: [{ id: 'g-si', codigo: 'SI', nome: 'Sistemas de Informação', descricao: '', area: 'Tecnologia' }],
    disciplinas: [criarDisciplina({
      id: 'd-alg', graduacaoId: 'g-si', codigo: 'ALG', nome: 'Algoritmos',
      descricaoCurta: '', descricao: '', nivel: 'Iniciante',
    })],
    periodosLetivos: [
      { id: 'p-26', nome: '2026.2', dataInicio: '2026-08-03', dataFim: '2026-12-18' },
      { id: 'p-27', nome: '2027.1', dataInicio: '2027-02-01', dataFim: '2027-06-30' },
    ],
    turmas: [
      { id: 't-26', codigo: 'A', disciplinaId: 'd-alg', periodoLetivoId: 'p-26' },
      { id: 't-27', codigo: 'A', disciplinaId: 'd-alg', periodoLetivoId: 'p-27' },
    ],
    matriculas: [{ id: 'm-ana-26', alunoId: 'u-ana', turmaId: 't-26', data: '2026-11-17' }],
    questoes: [],
    respostas: [],
    vinculosProfessor: [{ professorId: 'u-carla', turmaId: 't-26' }],
    vinculosCoordenador: [{ coordenadorId: 'u-carla', graduacaoId: 'g-si' }],
    vinculosResponsavel: [{ responsavelId: 'u-helena', alunoId: 'u-ana' }],
    revisoesTextuais: [],
  };
}
