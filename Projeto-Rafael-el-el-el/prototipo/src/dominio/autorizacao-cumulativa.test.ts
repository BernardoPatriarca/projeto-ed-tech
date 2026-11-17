import { describe, expect, it } from 'vitest';
import { criarFixtureAutorizacao } from '../testes/fixtures-autorizacao';
import { podeExecutar, type AcaoAcademica, type PedidoAutorizacao } from './autorizacao';

describe('2.2 — União de permissões sem misturar cursos ou funções', () => {
  it('permite a Carla autoria em SI e gestão acadêmica em Direito na mesma identidade', () => {
    const dados = criarFixtureAutorizacao();
    expect(podeExecutar(dados, 'u-carla', { acao: 'editar-conteudo', recurso: { tipo: 'disciplina', disciplinaId: 'd-alg' } })).toBe(true);
    expect(podeExecutar(dados, 'u-carla', { acao: 'editar-graduacao', recurso: { tipo: 'graduacao', graduacaoId: 'g-dir' } })).toBe(true);
    expect(podeExecutar(dados, 'u-carla', { acao: 'matricular', recurso: { tipo: 'turma', turmaId: 't-dir' } })).toBe(true);
    expect(podeExecutar(dados, 'u-carla', { acao: 'gerir-docentes', recurso: { tipo: 'turma', turmaId: 't-dir' } })).toBe(true);
  });

  it.each(['editar-conteudo', 'publicar-conteudo'] satisfies AcaoAcademica[])('coordenação de Direito e docência de SI não autorizam %s em Direito', (acao) => {
    const dados = criarFixtureAutorizacao();
    expect(podeExecutar(dados, 'u-carla', { acao, recurso: { tipo: 'disciplina', disciplinaId: 'd-dir' } })).toBe(false);
    expect(podeExecutar(dados, 'u-admin', { acao, recurso: { tipo: 'disciplina', disciplinaId: 'd-dir' } })).toBe(true);
  });

  it.each(['matricular', 'editar-turma', 'gerir-docentes'] satisfies AcaoAcademica[])('a docência em SI não autoriza sua gestão (%s)', (acao) => {
    expect(podeExecutar(criarFixtureAutorizacao(), 'u-carla', { acao, recurso: { tipo: 'turma', turmaId: 't-26' } })).toBe(false);
  });

  it('não libera turma paralela de SI por coordenar Direito', () => {
    expect(podeExecutar(criarFixtureAutorizacao(), 'u-carla', {
      acao: 'consultar-turma-docente', recurso: { tipo: 'turma', turmaId: 't-27' },
    })).toBe(false);
  });

  it('não deduz funções a partir de vínculos que continuam cadastrados', () => {
    const dados = criarFixtureAutorizacao(), carla = dados.usuarios.find((u) => u.id === 'u-carla')!;
    carla.funcoes = ['coordenador'];
    expect(podeExecutar(dados, carla.id, { acao: 'editar-conteudo', recurso: { tipo: 'disciplina', disciplinaId: 'd-alg' } })).toBe(false);
    carla.funcoes = ['professor'];
    expect(podeExecutar(dados, carla.id, { acao: 'editar-graduacao', recurso: { tipo: 'graduacao', graduacaoId: 'g-dir' } })).toBe(false);
    expect(podeExecutar(dados, carla.id, { acao: 'editar-conteudo', recurso: { tipo: 'disciplina', disciplinaId: 'd-alg' } })).toBe(true);
  });

  it('nega um terceiro curso, mesmo com as duas funções e vínculos em outros cursos', () => {
    const dados = criarFixtureAutorizacao();
    for (const pedido of [
      { acao: 'consultar-painel-coordenacao', recurso: { tipo: 'graduacao', graduacaoId: 'g-psi' } },
      { acao: 'editar-conteudo', recurso: { tipo: 'disciplina', disciplinaId: 'd-psi' } },
      { acao: 'matricular', recurso: { tipo: 'turma', turmaId: 't-psi' } },
    ] satisfies PedidoAutorizacao[]) expect(podeExecutar(dados, 'u-carla', pedido)).toBe(false);
  });

  it('revogar um vínculo não remove o acesso concedido por outra função no outro curso', () => {
    const dados = criarFixtureAutorizacao();
    dados.vinculosProfessor = [];
    expect(podeExecutar(dados, 'u-carla', { acao: 'editar-conteudo', recurso: { tipo: 'disciplina', disciplinaId: 'd-alg' } })).toBe(false);
    expect(podeExecutar(dados, 'u-carla', { acao: 'editar-turma', recurso: { tipo: 'turma', turmaId: 't-dir' } })).toBe(true);
    dados.vinculosCoordenador = [];
    expect(podeExecutar(dados, 'u-carla', { acao: 'editar-turma', recurso: { tipo: 'turma', turmaId: 't-dir' } })).toBe(false);
  });
});
