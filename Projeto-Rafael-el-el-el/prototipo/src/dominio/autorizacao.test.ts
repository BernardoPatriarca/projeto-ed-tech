import { describe, expect, it } from 'vitest';
import { criarFixtureAutorizacao } from '../testes/fixtures-autorizacao';
import { podeExecutar, type AcaoAcademica, type PedidoAutorizacao } from './autorizacao';

const docente: PedidoAutorizacao = { acao: 'consultar-turma-docente', recurso: { tipo: 'turma', turmaId: 't-26' } };

describe('2.1 — Políticas por ação, função e recurso real', () => {
  it.each([null, 'inexistente', 'u-ana', 'u-prof', 'u-coord'])('nega docência sem pessoa/função/vínculo (%s)', (autorId) => {
    expect(podeExecutar(criarFixtureAutorizacao(), autorId, docente)).toBe(false);
  });

  it('autoriza turma docente e nega turma paralela da mesma disciplina', () => {
    const dados = criarFixtureAutorizacao();
    expect(podeExecutar(dados, 'u-carla', docente)).toBe(true);
    expect(podeExecutar(dados, 'u-carla', { ...docente, recurso: { tipo: 'turma', turmaId: 't-27' } })).toBe(false);
  });

  it('resolve a hierarquia e rejeita pais falsificados ou inexistentes, inclusive para Admin', () => {
    const dados = criarFixtureAutorizacao();
    for (const pedido of [
      { acao: 'editar-turma', recurso: { tipo: 'turma', turmaId: 't-psi', graduacaoId: 'g-dir' } },
      { acao: 'editar-turma', recurso: { tipo: 'turma', turmaId: 't-26', disciplinaId: 'd-dir' } },
      { acao: 'editar-disciplina', recurso: { tipo: 'disciplina', disciplinaId: 'd-alg', graduacaoId: 'g-dir' } },
      { acao: 'editar-turma', recurso: { tipo: 'turma', turmaId: 'inexistente' } },
    ] satisfies PedidoAutorizacao[]) {
      expect(podeExecutar(dados, 'u-carla', pedido)).toBe(false);
      expect(podeExecutar(dados, 'u-admin', pedido)).toBe(false);
    }
  });

  it('nega recurso com cadeia quebrada em vez de confiar no ID da URL', () => {
    const dados = criarFixtureAutorizacao();
    dados.disciplinas[0].graduacaoId = 'inexistente';
    expect(podeExecutar(dados, 'u-carla', docente)).toBe(false);
    dados.disciplinas[0].graduacaoId = 'g-si';
    dados.turmas[0].periodoLetivoId = 'inexistente';
    expect(podeExecutar(dados, 'u-carla', docente)).toBe(false);
  });

  it.each([
    'criar-graduacao', 'administrar-periodos', 'administrar-usuarios',
    'gerir-coordenadores', 'gerir-responsaveis', 'consultar-administracao',
  ] satisfies AcaoAcademica[])('reserva %s ao Admin no escopo global', (acao) => {
    const dados = criarFixtureAutorizacao(), pedido: PedidoAutorizacao = { acao, recurso: { tipo: 'instituicao' } };
    expect(podeExecutar(dados, 'u-admin', pedido)).toBe(true);
    expect(podeExecutar(dados, 'u-carla', pedido)).toBe(false);
    expect(podeExecutar(dados, 'u-ana', pedido)).toBe(false);
  });

  it('autoriza somente a própria matrícula e o resumo do aluno vinculado ao Responsável', () => {
    const dados = criarFixtureAutorizacao();
    dados.disciplinas[0].status = 'publicado';
    const pedido: PedidoAutorizacao = { acao: 'consultar-estudo', recurso: { tipo: 'matricula', matriculaId: 'm-ana-26' } };
    expect(podeExecutar(dados, 'u-ana', pedido)).toBe(true);
    expect(podeExecutar(dados, 'u-carla', pedido)).toBe(false);
    expect(podeExecutar(dados, 'u-helena', { acao: 'consultar-painel-responsavel', recurso: { tipo: 'aluno', alunoId: 'u-ana' } })).toBe(true);
    expect(podeExecutar(dados, 'u-helena', { acao: 'consultar-painel-responsavel', recurso: { tipo: 'aluno', alunoId: 'u-carla' } })).toBe(false);
  });

  it('não dá acesso universal ao histórico detalhado por ser Admin ou Coordenador', () => {
    const dados = criarFixtureAutorizacao();
    const pedido: PedidoAutorizacao = { acao: 'consultar-historico-docente', recurso: { tipo: 'matricula', matriculaId: 'm-ana-26' } };
    expect(podeExecutar(dados, 'u-carla', pedido)).toBe(true);
    expect(podeExecutar(dados, 'u-admin', pedido)).toBe(false);
    expect(podeExecutar(dados, 'u-helena', pedido)).toBe(false);
    expect(podeExecutar(dados, 'u-carla', { ...pedido, recurso: { tipo: 'matricula', matriculaId: 'm-ana-27' } })).toBe(false);
  });

  it('nega combinações de ação/recurso erradas e não altera o documento', () => {
    const dados = criarFixtureAutorizacao(), antes = structuredClone(dados);
    expect(podeExecutar(dados, 'u-admin', { acao: 'editar-turma', recurso: { tipo: 'instituicao' } })).toBe(false);
    expect(dados).toEqual(antes);
  });
});
