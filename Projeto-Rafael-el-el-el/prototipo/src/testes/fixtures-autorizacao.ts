import { criarDisciplina } from '../dominio/academico';
import { criarFixtureAcademica } from './fixtures-academicas';

/** Carla leciona somente em SI e coordena somente Direito. Sem persistência ou seed. */
export function criarFixtureAutorizacao() {
  const dados = criarFixtureAcademica();
  dados.usuarios.push(
    { id: 'u-admin', nome: 'Admin', email: 'admin@exemplo.com', ativo: true, funcoes: ['admin'] },
    { id: 'u-prof', nome: 'Professor sem vínculo', email: 'prof@exemplo.com', ativo: true, funcoes: ['professor'] },
    { id: 'u-coord', nome: 'Coordenação sem vínculo', email: 'coord@exemplo.com', ativo: true, funcoes: ['coordenador'] },
  );
  for (const [sufixo, codigo, nome] of [['dir', 'DIR', 'Direito'], ['psi', 'PSI', 'Psicologia']]) {
    dados.graduacoes.push({ id: `g-${sufixo}`, codigo, nome, descricao: '', area: '' });
    dados.disciplinas.push(criarDisciplina({
      id: `d-${sufixo}`, graduacaoId: `g-${sufixo}`, codigo: 'INTRO', nome: `Introdução a ${nome}`,
      descricao: '', descricaoCurta: '', nivel: 'Iniciante',
    }));
    dados.turmas.push({ id: `t-${sufixo}`, codigo: 'A', disciplinaId: `d-${sufixo}`, periodoLetivoId: 'p-26' });
  }
  dados.vinculosCoordenador = [{ coordenadorId: 'u-carla', graduacaoId: 'g-dir' }];
  dados.matriculas.push({ id: 'm-ana-27', alunoId: 'u-ana', turmaId: 't-27', data: dados.dataVirtual });
  return dados;
}
