import { describe, expect, it } from 'vitest';
import { adicionarHistoricoSintetico, ambienteComandos, recusaSemEfeitos } from '../testes/ambiente-comandos-academicos';
import { podeExecutar } from '../dominio/autorizacao';
import { ComandosAcademicos, type CadastroUsuario } from './comandos-academicos';

const usuario: CadastroUsuario = { nome: 'Paulo', email: 'paulo@exemplo.com', funcoes: ['professor', 'coordenador'], ativo: true };
const coordenacao = { coordenadorId: 'u-carla', graduacaoId: 'g-si' };
const responsavel = { responsavelId: 'u-helena', alunoId: 'u-ana' };

/** Consulta apenas de teste sobre a primitiva existente; não antecipa a API de consultas de 2.10. */
class SondaResponsavel extends ComandosAcademicos {
  consultarAluno(alunoId: string) {
    return this.consultar({ acao: 'consultar-painel-responsavel', recurso: { tipo: 'aluno', alunoId } },
      (dados) => ({ alunoId, turmas: dados.matriculas.filter((m) => m.alunoId === alunoId).map((m) => m.turmaId) }));
  }
}

describe('2.9 — [PA] Administração de usuários, Limites globais; [OA] Coordenação; Responsável–Aluno', () => {
  it('Administrador cria/edita funções cumulativas e desativa sem apagar vínculos ou histórico', async () => {
    const a = ambienteComandos(adicionarHistoricoSintetico); await a.repo.entrar('u-admin'); const antes = a.ler();
    const novo = await a.repo.criarUsuario(usuario, 0);
    expect(novo).toMatchObject(usuario);
    novo.funcoes.push('admin');
    expect(a.ler().usuarios.find((u) => u.id === novo.id)!.funcoes).toEqual(['professor', 'coordenador']);
    const carla = antes.usuarios.find((u) => u.id === 'u-carla')!;
    // O id é rota, não é um campo admitido no formulário.
    const { id: _id, ...campos } = carla;
    await a.repo.editarUsuario(carla.id, { ...campos, nome: 'Carla atualizada', funcoes: ['professor'] }, 1);
    await a.repo.definirAtivo('u-ana', false, 2);
    const depois = a.ler();
    expect(depois.respostas).toEqual(antes.respostas); expect(depois.matriculas).toEqual(antes.matriculas);
    expect(depois.vinculosProfessor).toEqual(antes.vinculosProfessor);
    expect(depois.vinculosCoordenador).toEqual(antes.vinculosCoordenador);
    expect(depois.usuarios.find((u) => u.id === 'u-ana')!.ativo).toBe(false);
    expect(podeExecutar(depois, 'u-carla', { acao: 'editar-graduacao', recurso: { tipo: 'graduacao', graduacaoId: 'g-dir' } })).toBe(false);
    expect(podeExecutar(depois, 'u-carla', { acao: 'editar-conteudo', recurso: { tipo: 'disciplina', disciplinaId: 'd-alg' } })).toBe(true);
  });

  it.each([null, 'u-carla', 'u-coord', 'u-prof', 'u-helena', 'u-ana'])('nega administração global e autoatribuição indevida por %s', async (autor) => {
    const a = ambienteComandos(); if (autor) await a.repo.entrar(autor);
    const codigo = autor ? 'ACESSO_NEGADO' : 'SEM_SESSAO';
    await recusaSemEfeitos(a, () => a.repo.criarUsuario(usuario, 0), codigo);
    await recusaSemEfeitos(a, () => a.repo.editarUsuario(autor ?? 'u-ana', { ...usuario, funcoes: ['admin'] }, 0), codigo);
    await recusaSemEfeitos(a, () => a.repo.definirAtivo('u-admin', false, 0), codigo);
    await recusaSemEfeitos(a, () => a.repo.definirVinculoCoordenador({ ...coordenacao, coordenadorId: autor ?? 'u-carla' }, true, 0), codigo);
    await recusaSemEfeitos(a, () => a.repo.definirVinculoResponsavel(responsavel, false, 0), codigo);
  });

  it.each([
    { ...usuario, funcoes: [] }, { ...usuario, funcoes: ['professor', 'professor'] },
    { ...usuario, funcoes: ['reitor'] }, { ...usuario, perfil: 'admin' },
    { ...usuario, respostas: [] }, { ...usuario, ativo: 'sim' },
  ])('rejeita funções ou campos inválidos (%j) sem alteração parcial', async (campos) => {
    const a = ambienteComandos(); await a.repo.entrar('u-admin');
    await recusaSemEfeitos(a, () => a.repo.criarUsuario(campos as CadastroUsuario, 0), 'VALIDACAO_REJEITADA');
    await recusaSemEfeitos(a, () => a.repo.editarUsuario('u-carla', campos as CadastroUsuario, 0), 'VALIDACAO_REJEITADA');
  });

  it('permite pessoa inativa sem funções, mas rejeita reativação sem funções', async () => {
    const a = ambienteComandos(); await a.repo.entrar('u-admin');
    const novo = await a.repo.criarUsuario({ ...usuario, ativo: false, funcoes: [] }, 0);
    await recusaSemEfeitos(a, () => a.repo.definirAtivo(novo.id, true, 1), 'VALIDACAO_REJEITADA');
  });

  it('rejeita pessoa inexistente, identidade duplicada e revisão obsoleta', async () => {
    const a = ambienteComandos(); await a.repo.entrar('u-admin');
    await recusaSemEfeitos(a, () => a.repo.editarUsuario('inexistente', usuario, 0), 'VALIDACAO_REJEITADA');
    await recusaSemEfeitos(a, () => a.repo.definirAtivo('inexistente', false, 0), 'VALIDACAO_REJEITADA');
    a.gerarId.mockReturnValueOnce('u-ana');
    await recusaSemEfeitos(a, () => a.repo.criarUsuario(usuario, 0), 'VALIDACAO_REJEITADA');
    await recusaSemEfeitos(a, () => a.repo.editarUsuario('u-carla', usuario, 1), 'REVISAO_OBSOLETA');
  });

  it('um coordenador pode ter vários cursos e um curso vários coordenadores sem conceder docência', async () => {
    const a = ambienteComandos(); await a.repo.entrar('u-admin');
    await a.repo.definirVinculoCoordenador(coordenacao, true, 0);
    await a.repo.definirVinculoCoordenador({ coordenadorId: 'u-coord', graduacaoId: 'g-si' }, true, 1);
    expect(a.ler().vinculosCoordenador.filter((v) => v.coordenadorId === 'u-carla')).toHaveLength(2);
    expect(a.ler().vinculosCoordenador.filter((v) => v.graduacaoId === 'g-si')).toHaveLength(2);
    expect(podeExecutar(a.ler(), 'u-coord', { acao: 'editar-conteudo', recurso: { tipo: 'disciplina', disciplinaId: 'd-alg' } })).toBe(false);
    expect(a.ler().usuarios.find((u) => u.id === 'u-coord')!.funcoes).toEqual(['coordenador']);
  });

  it.each(['inexistente', 'u-ana', 'u-prof', 'u-coord'])('recusa atribuição de coordenador inexistente, inativo ou sem função (%s)', async (coordenadorId) => {
    const a = ambienteComandos((d) => { d.usuarios.find((u) => u.id === 'u-coord')!.ativo = false; });
    await a.repo.entrar('u-admin');
    await recusaSemEfeitos(a, () => a.repo.definirVinculoCoordenador({ ...coordenacao, coordenadorId }, true, 0), 'VALIDACAO_REJEITADA');
  });

  it('vínculos repetidos não gravam nem alteram revisão; remoção preserva históricos e outros vínculos', async () => {
    const a = ambienteComandos(adicionarHistoricoSintetico); await a.repo.entrar('u-admin'); const antes = a.ler();
    const original = a.bruto();
    expect(await a.repo.definirVinculoCoordenador({ coordenadorId: 'u-carla', graduacaoId: 'g-dir' }, true, 0)).toMatchObject({ alterado: false });
    expect(await a.repo.definirVinculoResponsavel(responsavel, true, 0)).toMatchObject({ alterado: false });
    expect(a.bruto()).toBe(original); expect(a.persistencia.gravar).not.toHaveBeenCalled();
    await a.repo.definirVinculoCoordenador(coordenacao, true, 0);
    await a.repo.definirVinculoCoordenador(coordenacao, false, 1);
    await a.repo.definirVinculoResponsavel(responsavel, false, 2);
    expect(a.ler().respostas).toEqual(antes.respostas); expect(a.ler().vinculosProfessor).toEqual(antes.vinculosProfessor);
    expect(a.ler().vinculosCoordenador).toEqual(antes.vinculosCoordenador);
    const removido = a.bruto();
    expect(await a.repo.definirVinculoResponsavel(responsavel, false, 3)).toMatchObject({ alterado: false });
    expect(a.bruto()).toBe(removido);
  });

  it('atribui Responsável a vários alunos e autoriza consulta somente dos vinculados, sem histórico detalhado', async () => {
    const a = ambienteComandos((d) => {
      adicionarHistoricoSintetico(d);
      d.usuarios.push({ id: 'u-bruno', nome: 'Bruno', email: 'bruno@exemplo.com', funcoes: ['aluno'], ativo: true });
    });
    const sonda = new SondaResponsavel(a.persistencia, a.sessao, a.gerarId);
    await a.repo.entrar('u-helena');
    expect(await sonda.consultarAluno('u-ana')).toEqual({ alunoId: 'u-ana', turmas: ['t-26', 't-27'] });
    await recusaSemEfeitos(a, () => sonda.consultarAluno('u-bruno'), 'ACESSO_NEGADO');
    await a.repo.entrar('u-admin');
    await a.repo.definirVinculoResponsavel({ ...responsavel, alunoId: 'u-bruno' }, true, 0);
    await a.repo.entrar('u-helena');
    expect(await sonda.consultarAluno('u-bruno')).toEqual({ alunoId: 'u-bruno', turmas: [] });
    expect(podeExecutar(a.ler(), 'u-helena', { acao: 'consultar-historico-docente', recurso: { tipo: 'matricula', matriculaId: 'm-ana-26' } })).toBe(false);
    await a.repo.entrar('u-admin');
    await a.repo.definirVinculoResponsavel(responsavel, false, 1);
    await a.repo.entrar('u-helena');
    await recusaSemEfeitos(a, () => sonda.consultarAluno('u-ana'), 'ACESSO_NEGADO');
  });

  it.each(['inexistente', 'u-prof', 'u-helena'])('rejeita Responsável inexistente, sem função ou inativo (%s)', async (responsavelId) => {
    const a = ambienteComandos((d) => { d.usuarios.find((u) => u.id === 'u-helena')!.ativo = false; });
    await a.repo.entrar('u-admin');
    await recusaSemEfeitos(a, () => a.repo.definirVinculoResponsavel({ ...responsavel, responsavelId }, true, 0), 'VALIDACAO_REJEITADA');
  });

  it('nega referências inválidas e campos extras nos vínculos globais', async () => {
    const a = ambienteComandos(); await a.repo.entrar('u-admin');
    await recusaSemEfeitos(a, () => a.repo.definirVinculoCoordenador({ ...coordenacao, graduacaoId: 'inexistente' }, true, 0), 'VALIDACAO_REJEITADA');
    await recusaSemEfeitos(a, () => a.repo.definirVinculoCoordenador({ ...coordenacao, funcoes: ['admin'] } as typeof coordenacao, true, 0), 'VALIDACAO_REJEITADA');
    await recusaSemEfeitos(a, () => a.repo.definirVinculoResponsavel({ ...responsavel, alunoId: 'inexistente' }, true, 0), 'VALIDACAO_REJEITADA');
    await recusaSemEfeitos(a, () => a.repo.definirVinculoResponsavel({ ...responsavel, alunoId: 'u-prof' }, true, 0), 'VALIDACAO_REJEITADA');
  });

  it('desativação do próprio Administrador é respeitada na próxima operação', async () => {
    const a = ambienteComandos(); await a.repo.entrar('u-admin');
    await a.repo.definirAtivo('u-admin', false, 0);
    await recusaSemEfeitos(a, () => a.repo.criarUsuario(usuario, 1), 'SESSAO_INVALIDA');
  });
});
