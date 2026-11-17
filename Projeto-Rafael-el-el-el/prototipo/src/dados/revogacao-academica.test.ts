import { describe, expect, it } from 'vitest';
import { ambienteConsultas } from '../testes/ambiente-consultas-academicas';
import { recusaSemEfeitos } from '../testes/ambiente-comandos-academicos';
import type { CadastroUsuario } from './comandos-academicos';

describe('2.11 — [OA] Revogação de vínculos; [PA] funções cumulativas e atividade; D2', () => {
  it('remover A preserva B e a autoria da disciplina compartilhada; remover o último vínculo revoga a autoria', async () => {
    const a = ambienteConsultas((d) => d.vinculosProfessor.push({ professorId: 'u-carla', turmaId: 't-b' }));
    const admin = a.outraSessao(); await admin.entrar('u-admin'); await a.repo.entrar('u-carla');
    const respostas = a.ler().respostas;
    const editor = await a.repo.consultarConteudoEditavel({ disciplinaId: 'd-alg' });
    const copiaEditor = structuredClone(editor);
    expect((await a.repo.consultarTurmasDocentes()).dados.map((t) => t.turma.id)).toEqual(['t-26', 't-b']);
    await a.repo.consultarMatriculados({ turmaId: 't-26' });

    await admin.definirVinculoProfessor({ turmaId: 't-26' }, { professorId: 'u-carla' }, false, 0);
    await recusaSemEfeitos(a, () => a.repo.consultarMatriculados({ turmaId: 't-26' }), 'ACESSO_NEGADO');
    expect((await a.repo.consultarTurmasDocentes()).dados.map((t) => t.turma.id)).toEqual(['t-b']);
    expect((await a.repo.consultarMatriculados({ turmaId: 't-b' })).dados.map((m) => m.aluno.id)).toEqual(['u-bruno', 'u-ana']);
    expect((await a.repo.consultarConteudoEditavel({ disciplinaId: 'd-alg' })).dados).toEqual(editor.dados);
    expect(a.ler().respostas).toEqual(respostas); expect(editor).toEqual(copiaEditor);

    await admin.definirVinculoProfessor({ turmaId: 't-b' }, { professorId: 'u-carla' }, false, 1);
    await recusaSemEfeitos(a, () => a.repo.consultarConteudoEditavel({ disciplinaId: 'd-alg' }), 'ACESSO_NEGADO');
    expect((await a.repo.consultarEstruturaAdministravel()).dados.graduacoes.map((g) => g.id)).toEqual(['g-dir']);
    expect(a.ler().respostas).toEqual(respostas);
    expect(a.ler().vinculosCoordenador).toEqual([{ coordenadorId: 'u-carla', graduacaoId: 'g-dir' }]);
  });

  it('remover função Coordenador mantém Professor e seus vínculos; não apaga coordenação armazenada ou histórico', async () => {
    const a = ambienteConsultas(); const admin = a.outraSessao();
    await admin.entrar('u-admin'); await a.repo.entrar('u-carla');
    const antes = a.ler(), carla = antes.usuarios.find((u) => u.id === 'u-carla')!;
    const { id: _id, ...campos } = carla;
    await a.repo.consultarEstruturaAdministravel();
    await admin.editarUsuario(carla.id, { ...campos, funcoes: ['professor'] }, 0);
    await recusaSemEfeitos(a, () => a.repo.consultarEstruturaAdministravel(), 'ACESSO_NEGADO');
    await recusaSemEfeitos(a, () => a.repo.matricular({ turmaId: 't-dir' }, { alunoId: 'u-bruno' }, 1), 'ACESSO_NEGADO');
    expect((await a.repo.consultarTurmasDocentes()).dados.map((t) => t.turma.id)).toEqual(['t-26']);
    await a.repo.consultarMatriculados({ turmaId: 't-26' });
    await a.repo.consultarConteudoEditavel({ disciplinaId: 'd-alg' });
    expect(a.ler().vinculosCoordenador).toEqual(antes.vinculosCoordenador);
    expect(a.ler().vinculosProfessor).toEqual(antes.vinculosProfessor);
    expect(a.ler().respostas).toEqual(antes.respostas);
  });

  it.each(['vinculo', 'funcao', 'desativacao'] as const)('editor cadastral aberto é negado ao salvar após %s, inclusive com revisão atual', async (revogacao) => {
    const a = ambienteConsultas(); const admin = a.outraSessao();
    await admin.entrar('u-admin'); await a.repo.entrar('u-carla');
    const leitura = await a.repo.consultarEstruturaAdministravel({ tipo: 'disciplina', disciplinaId: 'd-dir', graduacaoId: 'g-dir' });
    const retratoAberto = structuredClone(leitura);
    const { id, status: _status, ...campos } = leitura.dados.disciplinas[0];
    const historico = a.ler().respostas;
    if (revogacao === 'vinculo') {
      await admin.definirVinculoCoordenador({ coordenadorId: 'u-carla', graduacaoId: 'g-dir' }, false, leitura.revisao);
    } else if (revogacao === 'funcao') {
      const { id: _id, ...pessoa } = a.ler().usuarios.find((u) => u.id === 'u-carla')!;
      await admin.editarUsuario('u-carla', { ...pessoa, funcoes: ['professor'] }, leitura.revisao);
    } else {
      await admin.definirAtivo('u-carla', false, leitura.revisao);
    }
    const codigo = revogacao === 'desativacao' ? 'SESSAO_INVALIDA' : 'ACESSO_NEGADO';
    // A primeira tentativa usa o formulário aberto; a segunda demonstra que a recusa não depende só de revisão obsoleta.
    for (const revisao of [leitura.revisao, a.ler().revisao]) {
      await recusaSemEfeitos(a, () => a.repo.editarDisciplina({ disciplinaId: id, graduacaoId: 'g-dir' }, { ...campos, nome: 'Não salvar' }, revisao), codigo);
    }
    await recusaSemEfeitos(a, () => a.repo.consultarEstruturaAdministravel({ tipo: 'disciplina', disciplinaId: id }), codigo);
    expect(leitura).toEqual(retratoAberto);
    expect(a.ler().disciplinas.find((d) => d.id === id)!.nome).not.toBe('Não salvar');
    expect(a.ler().respostas).toEqual(historico);
  });

  it('revogar coordenação de um curso mantém outro curso coordenado e a docência independente', async () => {
    const a = ambienteConsultas((d) => d.vinculosCoordenador.push({ coordenadorId: 'u-carla', graduacaoId: 'g-psi' }));
    const admin = a.outraSessao(); await admin.entrar('u-admin'); await a.repo.entrar('u-carla');
    const antes = a.ler();
    await admin.definirVinculoCoordenador({ coordenadorId: 'u-carla', graduacaoId: 'g-dir' }, false, 0);
    expect((await a.repo.consultarEstruturaAdministravel()).dados.graduacoes.map((g) => g.id)).toEqual(['g-psi']);
    await recusaSemEfeitos(a, () => a.repo.matricular({ turmaId: 't-dir' }, { alunoId: 'u-bruno' }, 1), 'ACESSO_NEGADO');
    await recusaSemEfeitos(a, () => a.repo.definirVinculoProfessor({ turmaId: 't-dir' }, { professorId: 'u-prof' }, true, 1), 'ACESSO_NEGADO');
    await a.repo.matricular({ turmaId: 't-psi' }, { alunoId: 'u-bruno' }, 1);
    await a.repo.consultarConteudoEditavel({ disciplinaId: 'd-alg' });
    expect(a.ler().respostas).toEqual(antes.respostas);
    expect(a.ler().vinculosProfessor).toEqual(antes.vinculosProfessor);
  });

  it('revogar aluno do Responsável mantém os demais vínculos e nega a consulta na sessão aberta', async () => {
    const a = ambienteConsultas((d) => d.vinculosResponsavel.push({ responsavelId: 'u-helena', alunoId: 'u-bruno' }));
    const admin = a.outraSessao(); await admin.entrar('u-admin'); await a.repo.entrar('u-helena');
    const historico = a.ler().respostas;
    const anterior = await a.repo.consultarTurmasAlunoVinculado('u-ana');
    expect((await a.repo.consultarAlunosVinculados()).dados.map((u) => u.id)).toEqual(['u-ana', 'u-bruno']);
    await admin.definirVinculoResponsavel({ responsavelId: 'u-helena', alunoId: 'u-ana' }, false, 0);
    await recusaSemEfeitos(a, () => a.repo.consultarTurmasAlunoVinculado('u-ana'), 'ACESSO_NEGADO');
    expect((await a.repo.consultarAlunosVinculados()).dados.map((u) => u.id)).toEqual(['u-bruno']);
    expect((await a.repo.consultarTurmasAlunoVinculado('u-bruno')).dados.map((t) => t.turma.id)).toEqual(['t-b']);
    expect(a.ler().respostas).toEqual(historico);
    expect(anterior.dados.map((t) => t.turma.id)).toContain('t-26');
  });

  it('retirar função Responsável mantém função Aluno e suas matrículas sem apagar vínculos', async () => {
    const a = ambienteConsultas((d) => {
      d.usuarios.find((u) => u.id === 'u-helena')!.funcoes.push('aluno');
      d.matriculas.push({ id: 'm-helena', alunoId: 'u-helena', turmaId: 't-dir', data: d.dataVirtual });
    });
    const admin = a.outraSessao(); await admin.entrar('u-admin'); await a.repo.entrar('u-helena');
    const { id: _id, ...campos } = a.ler().usuarios.find((u) => u.id === 'u-helena')!;
    await a.repo.consultarAlunosVinculados();
    await admin.editarUsuario('u-helena', { ...campos, funcoes: ['aluno'] }, 0);
    await recusaSemEfeitos(a, () => a.repo.consultarTurmasAlunoVinculado('u-ana'), 'ACESSO_NEGADO');
    await recusaSemEfeitos(a, () => a.repo.consultarAlunosVinculados(), 'ACESSO_NEGADO');
    expect((await a.repo.consultarMinhasTurmas()).dados.map((t) => t.matricula.id)).toEqual(['m-helena']);
    expect(a.ler().vinculosResponsavel).toEqual([{ responsavelId: 'u-helena', alunoId: 'u-ana' }]);
  });

  it('último vínculo docente removido não elimina a autorização independente de Administrador', async () => {
    const a = ambienteConsultas((d) => d.vinculosProfessor.push({ professorId: 'u-prof', turmaId: 't-26' }));
    const admin = a.outraSessao(); await admin.entrar('u-admin'); await a.repo.entrar('u-prof');
    const editor = await a.repo.consultarConteudoEditavel({ disciplinaId: 'd-alg' });
    await admin.definirVinculoProfessor({ turmaId: 't-26' }, { professorId: 'u-prof' }, false, 0);
    expect((await a.repo.consultarTurmasDocentes()).dados).toEqual([]);
    expect((await a.repo.consultarConteudoEditavel({ disciplinaId: 'd-alg' })).dados).toEqual(editor.dados);
    expect((await a.repo.consultarEstruturaAdministravel()).dados.graduacoes).toHaveLength(3);
  });

  it.each(['u-carla', 'u-ana', 'u-helena', 'u-admin'])('pessoa %s desativada durante a sessão não continua consultando ou alterando', async (id) => {
    const a = ambienteConsultas(); const admin = a.outraSessao();
    await admin.entrar('u-admin'); await a.repo.entrar(id); const antes = a.ler();
    expect((await a.repo.obterSessao())!.id).toBe(id);
    await admin.definirAtivo(id, false, 0);
    expect(await a.repo.obterSessao()).toBeNull();
    await recusaSemEfeitos(a, () => a.repo.consultarCatalogo(), 'SESSAO_INVALIDA');
    await recusaSemEfeitos(a, () => a.repo.consultarEstruturaAdministravel(), 'SESSAO_INVALIDA');
    await recusaSemEfeitos(a, () => a.repo.consultarConteudoEditavel({ disciplinaId: 'd-alg' }), 'SESSAO_INVALIDA');
    await recusaSemEfeitos(a, () => a.repo.definirVinculoProfessor({ turmaId: 't-dir' }, { professorId: 'u-prof' }, true, 1), 'SESSAO_INVALIDA');
    expect(a.ler().respostas).toEqual(antes.respostas);
    expect(a.ler().matriculas).toEqual(antes.matriculas);
  });

  it('funções de um payload de usuário não substituem o autor de uma sessão sem permissão', async () => {
    const a = ambienteConsultas(); await a.repo.entrar('u-carla');
    const pessoa: CadastroUsuario = { nome: 'Carla', email: 'carla@exemplo.com', ativo: true, funcoes: ['admin'] };
    await recusaSemEfeitos(a, () => a.repo.editarUsuario('u-carla', pessoa, 0), 'ACESSO_NEGADO');
    expect((await a.repo.consultarEstruturaAdministravel()).dados.graduacoes.map((g) => g.id)).toEqual(['g-dir']);
  });
});
