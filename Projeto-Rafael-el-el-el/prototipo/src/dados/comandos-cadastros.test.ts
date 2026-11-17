import { describe, expect, it } from 'vitest';
import { adicionarHistoricoSintetico, ambienteComandos, recusaSemEfeitos } from '../testes/ambiente-comandos-academicos';
import type { CadastroDisciplina } from './comandos-academicos';

const graduacao = { codigo: 'AGR', nome: 'Agronomia', descricao: '', area: 'Agrárias' };
const periodo = { nome: '2028.1', dataInicio: '2028-02-01', dataFim: '2028-06-30' };

describe('2.5 — Graduações e períodos: [OA] Cadastro/Gestão de graduações, Períodos; [PA] Limites globais', () => {
  it('Administrador cria e edita graduação e período, com identidades estáveis e uma gravação por alteração', async () => {
    const a = ambienteComandos(); await a.repo.entrar('u-admin');
    const g = await a.repo.criarGraduacao(graduacao, 0);
    expect(g.id).toBe('novo-1');
    expect(await a.repo.editarGraduacao(g.id, { ...graduacao, codigo: 'AGRO' }, 1)).toMatchObject({ id: g.id, codigo: 'AGRO' });
    const p = await a.repo.criarPeriodoLetivo(periodo, 2);
    expect(await a.repo.editarPeriodoLetivo(p.id, { ...periodo, nome: '2028 primeiro' }, 3)).toMatchObject({ id: p.id, nome: '2028 primeiro' });
    expect(a.persistencia.gravar).toHaveBeenCalledTimes(4);
    expect(a.ler().revisao).toBe(4);
  });

  it.each(['u-carla', 'u-prof', 'u-ana'])('nega criação e períodos globais por %s, sem efeitos', async (id) => {
    const a = ambienteComandos(); await a.repo.entrar(id);
    await recusaSemEfeitos(a, () => a.repo.criarGraduacao(graduacao, 0), 'ACESSO_NEGADO');
    await recusaSemEfeitos(a, () => a.repo.criarPeriodoLetivo(periodo, 0), 'ACESSO_NEGADO');
    await recusaSemEfeitos(a, () => a.repo.editarPeriodoLetivo('p-26', periodo, 0), 'ACESSO_NEGADO');
  });

  it('Coordenador edita somente sua graduação e preserva a estrutura e os vínculos', async () => {
    const a = ambienteComandos(); await a.repo.entrar('u-carla'); const antes = a.ler();
    await a.repo.editarGraduacao('g-dir', { ...graduacao, codigo: 'DIR' }, 0);
    expect(a.ler()).toEqual({ ...antes, revisao: 1, graduacoes: antes.graduacoes.map((g) => g.id === 'g-dir' ? { ...g, ...graduacao, codigo: 'DIR' } : g) });
    await recusaSemEfeitos(a, () => a.repo.editarGraduacao('g-si', graduacao, 1), 'ACESSO_NEGADO');
  });

  it.each([{ ...graduacao, codigo: '' }, { ...graduacao, nome: ' ' }, { ...graduacao, codigo: 'SI' }])('rejeita obrigatoriedade e código duplicado (%j)', async (campos) => {
    const a = ambienteComandos(); await a.repo.entrar('u-admin');
    await recusaSemEfeitos(a, () => a.repo.criarGraduacao(campos, 0), 'VALIDACAO_REJEITADA');
    await recusaSemEfeitos(a, () => a.repo.editarGraduacao('g-dir', campos, 0), 'VALIDACAO_REJEITADA');
  });

  it.each([{ ...periodo, nome: '' }, { ...periodo, dataFim: '2028-01-01' }, { ...periodo, dataInicio: '2028-02-30' }])('rejeita período inválido (%j)', async (campos) => {
    const a = ambienteComandos(); await a.repo.entrar('u-admin');
    await recusaSemEfeitos(a, () => a.repo.criarPeriodoLetivo(campos, 0), 'VALIDACAO_REJEITADA');
  });

  it('nega recursos inexistentes, ID duplicado, payload indevido e formulário obsoleto', async () => {
    const a = ambienteComandos(); await a.repo.entrar('u-admin');
    await recusaSemEfeitos(a, () => a.repo.editarGraduacao('inexistente', graduacao, 0));
    await recusaSemEfeitos(a, () => a.repo.editarPeriodoLetivo('inexistente', periodo, 0), 'VALIDACAO_REJEITADA');
    a.gerarId.mockReturnValueOnce('p-26');
    await recusaSemEfeitos(a, () => a.repo.criarPeriodoLetivo(periodo, 0), 'VALIDACAO_REJEITADA');
    await recusaSemEfeitos(a, () => a.repo.criarGraduacao({ ...graduacao, topicos: [] } as typeof graduacao, 0), 'VALIDACAO_REJEITADA');
    await recusaSemEfeitos(a, () => a.repo.criarGraduacao(graduacao, 2), 'REVISAO_OBSOLETA');
  });
});

const disciplina: CadastroDisciplina = {
  graduacaoId: 'g-dir', codigo: 'CIV', nome: 'Direito Civil', descricaoCurta: '', descricao: '', nivel: 'Iniciante',
};
const turma = { codigo: 'B', disciplinaId: 'd-dir', periodoLetivoId: 'p-27' };

describe('2.6 — [OA] Disciplinas, Ofertas, Identidade; [GC] separação do conteúdo; D1/D4', () => {
  it.each(['u-admin', 'u-carla'])('%s cria e edita sua disciplina/turma sem criar conteúdo, matrícula ou vínculo docente', async (id) => {
    const a = ambienteComandos(); await a.repo.entrar(id); const antes = a.ler();
    const d = await a.repo.criarDisciplina(disciplina, 0);
    expect(d).toMatchObject({ ...disciplina, status: 'rascunho', topicos: [] });
    await a.repo.editarDisciplina({ disciplinaId: d.id, graduacaoId: 'g-dir' }, { ...disciplina, nome: 'Civil I' }, 1);
    const t = await a.repo.criarTurma({ ...turma, disciplinaId: d.id }, 2);
    await a.repo.editarTurma({ turmaId: t.id, disciplinaId: d.id, graduacaoId: 'g-dir' }, { ...turma, disciplinaId: d.id, codigo: 'C' }, 3);
    expect(a.ler().questoes).toEqual(antes.questoes);
    expect(a.ler().matriculas).toEqual(antes.matriculas);
    expect(a.ler().vinculosProfessor).toEqual(antes.vinculosProfessor);
  });

  it('nega gestão do outro curso e docência não concede gestão acadêmica', async () => {
    const a = ambienteComandos(); await a.repo.entrar('u-carla');
    await recusaSemEfeitos(a, () => a.repo.criarDisciplina({ ...disciplina, graduacaoId: 'g-si' }, 0), 'ACESSO_NEGADO');
    await recusaSemEfeitos(a, () => a.repo.criarTurma({ ...turma, disciplinaId: 'd-alg' }, 0), 'ACESSO_NEGADO');
  });

  it('exige origem e destino: não importa recurso de outro curso nem exporta o próprio sem permissão', async () => {
    const a = ambienteComandos(); await a.repo.entrar('u-carla');
    for (const [id, destino] of [['d-dir', 'g-psi'], ['d-psi', 'g-dir']]) {
      await recusaSemEfeitos(a, () => a.repo.editarDisciplina({ disciplinaId: id }, { ...disciplina, graduacaoId: destino }, 0), 'ACESSO_NEGADO');
    }
    for (const [id, destino] of [['t-dir', 'd-psi'], ['t-psi', 'd-dir']]) {
      await recusaSemEfeitos(a, () => a.repo.editarTurma({ turmaId: id }, { ...turma, disciplinaId: destino }, 0), 'ACESSO_NEGADO');
    }
  });

  it.each(['u-admin', 'u-carla'])('permite transferência sem estudo com autorização para ambos os cursos (%s)', async (id) => {
    const a = ambienteComandos((d) => d.vinculosCoordenador.push({ coordenadorId: 'u-carla', graduacaoId: 'g-psi' }));
    await a.repo.entrar(id);
    expect(await a.repo.editarDisciplina({ disciplinaId: 'd-dir' }, { ...disciplina, graduacaoId: 'g-psi' }, 0)).toMatchObject({ id: 'd-dir', graduacaoId: 'g-psi' });
    expect(await a.repo.editarTurma({ turmaId: 't-dir' }, { ...turma, disciplinaId: 'd-psi' }, 1)).toMatchObject({ id: 't-dir', disciplinaId: 'd-psi', periodoLetivoId: 'p-27' });
  });

  it.each(['topicos', 'questoes', 'status', 'respostas', 'xp', 'id'])('rejeita campo %s no cadastro, inclusive para Administrador', async (campo) => {
    const a = ambienteComandos(); await a.repo.entrar('u-admin');
    const campos = { ...disciplina, [campo]: campo === 'status' ? 'publicado' : [] };
    await recusaSemEfeitos(a, () => a.repo.criarDisciplina(campos, 0), 'VALIDACAO_REJEITADA');
    await recusaSemEfeitos(a, () => a.repo.editarDisciplina({ disciplinaId: 'd-dir' }, campos, 0), 'VALIDACAO_REJEITADA');
    await recusaSemEfeitos(a, () => a.repo.criarTurma({ ...turma, [campo]: [] }, 0), 'VALIDACAO_REJEITADA');
  });

  it('nega referências inexistentes e pais incompatíveis de URL, inclusive para Administrador', async () => {
    const a = ambienteComandos(); await a.repo.entrar('u-admin');
    await recusaSemEfeitos(a, () => a.repo.criarDisciplina({ ...disciplina, graduacaoId: 'inexistente' }, 0));
    await recusaSemEfeitos(a, () => a.repo.criarTurma({ ...turma, disciplinaId: 'inexistente' }, 0));
    await recusaSemEfeitos(a, () => a.repo.criarTurma({ ...turma, periodoLetivoId: 'inexistente' }, 0), 'VALIDACAO_REJEITADA');
    await recusaSemEfeitos(a, () => a.repo.editarDisciplina({ disciplinaId: 'd-dir', graduacaoId: 'g-si' }, disciplina, 0), 'ACESSO_NEGADO');
    await recusaSemEfeitos(a, () => a.repo.editarTurma({ turmaId: 't-dir', disciplinaId: 'd-alg' }, turma, 0), 'ACESSO_NEGADO');
  });

  it('valida códigos por escopo e nível, e admite turmas paralelas/novos períodos', async () => {
    const a = ambienteComandos(); await a.repo.entrar('u-admin');
    await recusaSemEfeitos(a, () => a.repo.criarDisciplina({ ...disciplina, codigo: 'INTRO' }, 0), 'VALIDACAO_REJEITADA');
    await recusaSemEfeitos(a, () => a.repo.criarDisciplina({ ...disciplina, codigo: '' }, 0), 'VALIDACAO_REJEITADA');
    await recusaSemEfeitos(a, () => a.repo.criarDisciplina({ ...disciplina, nivel: '2026.2' as CadastroDisciplina['nivel'] }, 0), 'VALIDACAO_REJEITADA');
    const d = await a.repo.criarDisciplina({ ...disciplina, graduacaoId: 'g-si', codigo: 'INTRO' }, 0);
    expect(d.graduacaoId).toBe('g-si');
    await recusaSemEfeitos(a, () => a.repo.criarTurma({ ...turma, codigo: 'A', periodoLetivoId: 'p-26' }, 1), 'VALIDACAO_REJEITADA');
    await recusaSemEfeitos(a, () => a.repo.criarTurma({ ...turma, codigo: '' }, 1), 'VALIDACAO_REJEITADA');
    await a.repo.criarTurma(turma, 1);
    await a.repo.criarTurma({ ...turma, codigo: 'A' }, 2);
    await a.repo.criarTurma({ ...turma, codigo: 'B', periodoLetivoId: 'p-26' }, 3);
  });

  it.each([false, true])('matrícula bloqueia mudança de disciplina/período/graduação, com respostas=%s', async (comResposta) => {
    const a = ambienteComandos(comResposta ? adicionarHistoricoSintetico : undefined); await a.repo.entrar('u-admin');
    await recusaSemEfeitos(a, () => a.repo.editarTurma({ turmaId: 't-26' }, { codigo: 'B', disciplinaId: 'd-alg', periodoLetivoId: 'p-27' }, 0), 'VALIDACAO_REJEITADA');
    await recusaSemEfeitos(a, () => a.repo.editarTurma({ turmaId: 't-26' }, { codigo: 'B', disciplinaId: 'd-dir', periodoLetivoId: 'p-26' }, 0), 'VALIDACAO_REJEITADA');
    await recusaSemEfeitos(a, () => a.repo.editarDisciplina({ disciplinaId: 'd-alg' }, disciplina, 0), 'VALIDACAO_REJEITADA');
  });

  it('renomear códigos e metadados preserva publicação, conteúdo, matrículas, vínculos e histórico', async () => {
    const a = ambienteComandos(adicionarHistoricoSintetico); await a.repo.entrar('u-admin'); const antes = a.ler();
    await a.repo.editarTurma({ turmaId: 't-26' }, { codigo: 'RENOMEADA', disciplinaId: 'd-alg', periodoLetivoId: 'p-26' }, 0);
    await a.repo.editarDisciplina({ disciplinaId: 'd-alg' }, { ...disciplina, graduacaoId: 'g-si', codigo: 'ALG2' }, 1);
    const depois = a.ler();
    expect(depois.respostas).toEqual(antes.respostas); expect(depois.questoes).toEqual(antes.questoes);
    expect(depois.matriculas).toEqual(antes.matriculas); expect(depois.vinculosProfessor).toEqual(antes.vinculosProfessor);
    expect(depois.disciplinas[0].topicos).toEqual(antes.disciplinas[0].topicos);
    expect(depois.disciplinas[0].status).toBe('publicado');
  });
});
