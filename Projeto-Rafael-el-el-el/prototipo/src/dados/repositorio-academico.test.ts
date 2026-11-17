import { describe, expect, it, vi } from 'vitest';
import type { DadosAcademicos, Funcao } from '../dominio/tipos';
import type { PedidoAutorizacao } from '../dominio/autorizacao';
import type { LeituraProfunda } from '../dominio/autorizacao';
import { validarGraduacao, validarPeriodoLetivo } from '../dominio/academico';
import { criarFixtureAutorizacao } from '../testes/fixtures-autorizacao';
import {
  RepositorioAcademico, type PersistenciaAcademica, type SessaoAcademica, type ValidadorCandidato,
} from './repositorio-academico';

interface PayloadSonda { turmaId: string; autorId?: string; funcoes?: Funcao[]; graduacaoId?: string }

/** Fachada só de teste; os comandos/retornos de negócio de 2.5+ não são expostos em produção. */
class RepositorioSonda extends RepositorioAcademico {
  consultarTurma(payload: PayloadSonda) {
    return this.consultar({ acao: 'consultar-turma-docente', recurso: { tipo: 'turma', turmaId: payload.turmaId, graduacaoId: payload.graduacaoId } },
      (dados, autor) => ({ autorId: autor.id, codigo: dados.turmas.find((t) => t.id === payload.turmaId)!.codigo }));
  }

  async prepararComando(payload: PayloadSonda) {
    const contexto = this.contextoAutorizado({ acao: 'editar-turma', recurso: { tipo: 'turma', turmaId: payload.turmaId, graduacaoId: payload.graduacaoId } });
    return { autorId: contexto.autor.id };
  }

  consultarComSeletor(pedido: PedidoAutorizacao, selecionar: () => string) {
    return this.consultar(pedido, selecionar);
  }

  alterarSonda<T>(
    pedidos: PedidoAutorizacao | readonly PedidoAutorizacao[], revisao: number,
    preparar: (dados: DadosAcademicos, autor: LeituraProfunda<DadosAcademicos['usuarios'][number]>) => T,
    validar: ValidadorCandidato,
  ) {
    return this.alterar(pedidos, revisao, preparar, validar);
  }
}

function ambiente() {
  let bruto: string | null = JSON.stringify(criarFixtureAutorizacao());
  let usuarioId: string | null = null;
  const persistencia: PersistenciaAcademica = {
    ler: vi.fn(() => bruto),
    gravar: vi.fn((valor: string) => { bruto = valor; }),
  };
  const sessao: SessaoAcademica = {
    obterUsuarioId: () => usuarioId,
    definirUsuarioId: vi.fn((id: string | null) => { usuarioId = id; }),
  };
  return {
    repo: new RepositorioSonda(persistencia, sessao), persistencia, sessao,
    lerBruto: () => bruto,
    definirBruto: (valor: string | null) => { bruto = valor; },
    alterarExternamente: (alterar: (dados: DadosAcademicos) => void) => {
      const dados = JSON.parse(bruto!) as DadosAcademicos;
      alterar(dados); bruto = JSON.stringify(dados);
    },
  };
}

describe('2.3 — Autor da sessão em cada consulta/comando', () => {
  it('nega consulta e entrada de comando sem sessão, sem executar seletor ou gravar', async () => {
    const a = ambiente(), antes = a.lerBruto(), selecionar = vi.fn(() => 'restrito');
    await expect(a.repo.consultarComSeletor({ acao: 'consultar-turma-docente', recurso: { tipo: 'turma', turmaId: 't-26' } }, selecionar)).rejects.toMatchObject({ codigo: 'SEM_SESSAO' });
    await expect(a.repo.prepararComando({ turmaId: 't-dir' })).rejects.toMatchObject({ codigo: 'SEM_SESSAO' });
    expect(selecionar).not.toHaveBeenCalled();
    expect(a.persistencia.gravar).not.toHaveBeenCalled();
    expect(a.lerBruto()).toBe(antes);
  });

  it('mantém entrada simulada sem senha e saída sem alterar o documento', async () => {
    const a = ambiente(), antes = a.lerBruto();
    const usuario = await a.repo.entrar('u-carla');
    usuario.funcoes.push('admin');
    expect(await a.repo.obterSessao()).toMatchObject({ id: 'u-carla', funcoes: ['professor', 'coordenador'] });
    expect(await a.repo.consultarTurma({ turmaId: 't-26' })).toMatchObject({ autorId: 'u-carla' });
    await a.repo.sair();
    expect(await a.repo.obterSessao()).toBeNull();
    await expect(a.repo.consultarTurma({ turmaId: 't-26' })).rejects.toMatchObject({ codigo: 'SEM_SESSAO' });
    expect(a.lerBruto()).toBe(antes);
  });

  it.each(['u-ana', 'u-prof', 'u-coord'])('nega consulta sem função ou vínculo (%s)', async (id) => {
    const a = ambiente(); await a.repo.entrar(id);
    await expect(a.repo.consultarTurma({ turmaId: 't-26' })).rejects.toMatchObject({ codigo: 'ACESSO_NEGADO' });
    expect(a.persistencia.gravar).not.toHaveBeenCalled();
  });

  it('não aceita identidade/funções falsificadas em consulta ou comando', async () => {
    const a = ambiente(); await a.repo.entrar('u-ana');
    const payload: PayloadSonda = { turmaId: 't-dir', autorId: 'u-admin', funcoes: ['admin'] };
    await expect(a.repo.consultarTurma(payload)).rejects.toMatchObject({ codigo: 'ACESSO_NEGADO' });
    await expect(a.repo.prepararComando(payload)).rejects.toMatchObject({ codigo: 'ACESSO_NEGADO' });
    expect(a.persistencia.gravar).not.toHaveBeenCalled();
    await a.repo.entrar('u-carla');
    expect(await a.repo.prepararComando(payload)).toEqual({ autorId: 'u-carla' });
  });

  it('reconsulta atividade após desativação durante a sessão', async () => {
    const a = ambiente(); await a.repo.entrar('u-carla');
    a.alterarExternamente((dados) => { dados.usuarios.find((u) => u.id === 'u-carla')!.ativo = false; });
    const antes = a.lerBruto();
    expect(await a.repo.obterSessao()).toBeNull();
    await expect(a.repo.consultarTurma({ turmaId: 't-26' })).rejects.toMatchObject({ codigo: 'SESSAO_INVALIDA' });
    await expect(a.repo.prepararComando({ turmaId: 't-dir' })).rejects.toMatchObject({ codigo: 'SESSAO_INVALIDA' });
    expect(a.lerBruto()).toBe(antes);
    expect(a.persistencia.gravar).not.toHaveBeenCalled();
  });

  it('revoga função e vínculo na operação seguinte sem reaproveitar autorização anterior', async () => {
    const a = ambiente(); await a.repo.entrar('u-carla');
    await a.repo.consultarTurma({ turmaId: 't-26' });
    a.alterarExternamente((dados) => { dados.vinculosProfessor = []; });
    await expect(a.repo.consultarTurma({ turmaId: 't-26' })).rejects.toMatchObject({ codigo: 'ACESSO_NEGADO' });
    expect(await a.repo.prepararComando({ turmaId: 't-dir' })).toEqual({ autorId: 'u-carla' });
    a.alterarExternamente((dados) => { dados.usuarios.find((u) => u.id === 'u-carla')!.funcoes = ['professor']; });
    await expect(a.repo.prepararComando({ turmaId: 't-dir' })).rejects.toMatchObject({ codigo: 'ACESSO_NEGADO' });
  });

  it('não reutiliza retratos de outra sessão e não compartilha objetos retornados', async () => {
    const a = ambiente(); await a.repo.entrar('u-carla');
    const retorno = await a.repo.consultarTurma({ turmaId: 't-26' });
    retorno.codigo = 'ALTERADO FORA';
    expect((await a.repo.consultarTurma({ turmaId: 't-26' })).codigo).toBe('A');
    await a.repo.entrar('u-ana');
    await expect(a.repo.consultarTurma({ turmaId: 't-26' })).rejects.toMatchObject({ codigo: 'ACESSO_NEGADO' });
  });

  it.each([null, '{invalido', '{"versaoSeed":1,"usuarios":[]}'])('não inicializa nem substitui dados ausentes/incompatíveis (%s)', async (bruto) => {
    const a = ambiente(); a.definirBruto(bruto);
    await expect(a.repo.entrar('u-carla')).rejects.toMatchObject({ codigo: bruto === null ? 'DADOS_NAO_INICIALIZADOS' : 'DADOS_INCOMPATIVEIS' });
    expect(a.lerBruto()).toBe(bruto);
    expect(a.persistencia.gravar).not.toHaveBeenCalled();
    expect(a.sessao.definirUsuarioId).not.toHaveBeenCalled();
  });

  it('nega login de pessoa inativa ou inexistente preservando a sessão anterior', async () => {
    const a = ambiente(); await a.repo.entrar('u-ana');
    a.alterarExternamente((dados) => { dados.usuarios.find((u) => u.id === 'u-carla')!.ativo = false; });
    await expect(a.repo.entrar('u-carla')).rejects.toMatchObject({ codigo: 'SESSAO_INVALIDA' });
    await expect(a.repo.entrar('inexistente')).rejects.toMatchObject({ codigo: 'SESSAO_INVALIDA' });
    expect((await a.repo.obterSessao())?.id).toBe('u-ana');
  });
});

const editarDireito: PedidoAutorizacao = { acao: 'editar-graduacao', recurso: { tipo: 'graduacao', graduacaoId: 'g-dir' } };

/** Validação da sonda inteira; as regras de conteúdo/publicação dos grupos seguintes não são antecipadas. */
const validarSonda: ValidadorCandidato = (dados) => {
  const erros: Record<string, string> = {};
  for (const g of dados.graduacoes) {
    Object.entries(validarGraduacao(structuredClone(g), structuredClone(dados.graduacoes) as DadosAcademicos['graduacoes']))
      .forEach(([campo, mensagem]) => { erros[`graduacoes.${g.id}.${campo}`] = mensagem; });
  }
  for (const p of dados.periodosLetivos) {
    Object.entries(validarPeriodoLetivo(structuredClone(p)))
      .forEach(([campo, mensagem]) => { erros[`periodos.${p.id}.${campo}`] = mensagem; });
  }
  return erros;
};

const renomearDireito = (dados: DadosAcademicos) => {
  const graduacao = dados.graduacoes.find((g) => g.id === 'g-dir')!;
  graduacao.nome = 'Direito atualizado';
  return { nome: graduacao.nome };
};

describe('2.4 — Candidato completo, revisão e única gravação', () => {
  it('valida o documento final inteiro antes de uma única gravação e avança a revisão uma vez', async () => {
    const a = ambiente(); await a.repo.entrar('u-carla');
    const antes = a.lerBruto();
    const validar = vi.fn<ValidadorCandidato>((candidato, anterior) => {
      expect(a.persistencia.gravar).not.toHaveBeenCalled();
      expect(a.lerBruto()).toBe(antes);
      expect(candidato.revisao).toBe(1);
      expect(anterior.revisao).toBe(0);
      expect(candidato.matriculas).toEqual(anterior.matriculas);
      expect(candidato.graduacoes.find((g) => g.id === 'g-dir')!.nome).toBe('Direito atualizado');
      return validarSonda(candidato, anterior);
    });
    expect(await a.repo.alterarSonda(editarDireito, 0, renomearDireito, validar)).toEqual({ nome: 'Direito atualizado' });
    expect(validar).toHaveBeenCalledTimes(1);
    expect(a.persistencia.gravar).toHaveBeenCalledTimes(1);
    expect(JSON.parse(a.lerBruto()!).revisao).toBe(1);
  });

  it.each([null, 'u-ana', 'u-prof'])('não prepara nem grava comando sem sessão ou permissão (%s)', async (id) => {
    const a = ambiente(); if (id) await a.repo.entrar(id);
    const antes = a.lerBruto(), preparar = vi.fn(renomearDireito), validar = vi.fn(validarSonda);
    await expect(a.repo.alterarSonda(editarDireito, 0, preparar, validar)).rejects.toMatchObject({ codigo: id ? 'ACESSO_NEGADO' : 'SEM_SESSAO' });
    expect(preparar).not.toHaveBeenCalled(); expect(validar).not.toHaveBeenCalled();
    expect(a.persistencia.gravar).not.toHaveBeenCalled(); expect(a.lerBruto()).toBe(antes);
  });

  it('ignora autor/funções falsificados também na alteração persistível', async () => {
    const a = ambiente(); await a.repo.entrar('u-ana');
    const payload = { autorId: 'u-admin', funcoes: ['admin'], nome: 'Falsificado' };
    const antes = a.lerBruto(), preparar = vi.fn((dados: DadosAcademicos) => {
      dados.graduacoes.find((g) => g.id === 'g-dir')!.nome = payload.nome;
    });
    await expect(a.repo.alterarSonda(editarDireito, 0, preparar, validarSonda)).rejects.toMatchObject({ codigo: 'ACESSO_NEGADO' });
    expect(preparar).not.toHaveBeenCalled(); expect(a.lerBruto()).toBe(antes);
    await a.repo.entrar('u-carla');
    expect(await a.repo.alterarSonda(editarDireito, 0, (_dados, autor) => ({ autorId: autor.id }), validarSonda)).toEqual({ autorId: 'u-carla' });
  });

  it('recusa formulário obsoleto antes da transformação e preserva o último documento e objetos lidos', async () => {
    const a = ambiente(); await a.repo.entrar('u-carla');
    const lido = await a.repo.consultarTurma({ turmaId: 't-26' }), copia = structuredClone(lido);
    await a.repo.alterarSonda(editarDireito, 0, renomearDireito, validarSonda);
    const antes = a.lerBruto(), preparar = vi.fn(renomearDireito);
    vi.mocked(a.persistencia.gravar).mockClear();
    await expect(a.repo.alterarSonda(editarDireito, 0, preparar, validarSonda)).rejects.toMatchObject({ codigo: 'REVISAO_OBSOLETA' });
    expect(preparar).not.toHaveBeenCalled(); expect(a.persistencia.gravar).not.toHaveBeenCalled();
    expect(a.lerBruto()).toBe(antes); expect(lido).toEqual(copia);
  });

  it('validação recusada não salva nem a parte válida e não modifica retratos em memória', async () => {
    const a = ambiente(); await a.repo.entrar('u-carla');
    const antes = a.lerBruto(), lido = await a.repo.consultarTurma({ turmaId: 't-26' }), copia = structuredClone(lido);
    await expect(a.repo.alterarSonda(editarDireito, 0, (dados) => {
      renomearDireito(dados);
      dados.periodosLetivos[0].dataFim = '2026-01-01';
      dados.matriculas = [];
    }, validarSonda)).rejects.toMatchObject({ codigo: 'VALIDACAO_REJEITADA', detalhes: { 'periodos.p-26.dataFim': expect.any(String) } });
    expect(a.persistencia.gravar).not.toHaveBeenCalled(); expect(a.lerBruto()).toBe(antes); expect(lido).toEqual(copia);
  });

  it('exceção na transformação ou no validador aborta sem efeitos e libera a instância', async () => {
    const a = ambiente(); await a.repo.entrar('u-carla'); const antes = a.lerBruto();
    await expect(a.repo.alterarSonda(editarDireito, 0, (dados) => {
      renomearDireito(dados); throw new Error('Falha na preparação');
    }, validarSonda)).rejects.toThrow('Falha na preparação');
    await expect(a.repo.alterarSonda(editarDireito, 0, renomearDireito, () => { throw new Error('Falha na validação'); })).rejects.toThrow('Falha na validação');
    expect(a.persistencia.gravar).not.toHaveBeenCalled(); expect(a.lerBruto()).toBe(antes);
    await expect(a.repo.alterarSonda(editarDireito, 0, renomearDireito, validarSonda)).resolves.toBeDefined();
  });

  it('falha de persistência não produz sucesso nem deixa candidato em cache', async () => {
    const a = ambiente(); await a.repo.entrar('u-carla');
    const antes = a.lerBruto(), lido = await a.repo.consultarTurma({ turmaId: 't-26' });
    vi.mocked(a.persistencia.gravar).mockImplementationOnce(() => { throw new Error('Disco cheio'); });
    await expect(a.repo.alterarSonda(editarDireito, 0, renomearDireito, validarSonda)).rejects.toMatchObject({ codigo: 'FALHA_PERSISTENCIA' });
    expect(a.persistencia.gravar).toHaveBeenCalledTimes(1); expect(a.lerBruto()).toBe(antes);
    expect(await a.repo.consultarTurma({ turmaId: 't-26' })).toEqual(lido);
    expect(JSON.parse(a.lerBruto()!).graduacoes.find((g: { id: string }) => g.id === 'g-dir').nome).toBe('Direito');
  });

  it('não compartilha o candidato retido nem o resultado devolvido com os dados gravados', async () => {
    const a = ambiente(); await a.repo.entrar('u-carla'); let retido: DadosAcademicos | undefined;
    const retorno = await a.repo.alterarSonda(editarDireito, 0, (dados) => {
      retido = dados; renomearDireito(dados); return dados.graduacoes.find((g) => g.id === 'g-dir')!;
    }, validarSonda);
    const salvo = a.lerBruto(); retorno.nome = 'Retorno alterado'; retido!.graduacoes[1].nome = 'Candidato alterado';
    expect(a.lerBruto()).toBe(salvo);
  });

  it('o validador não consegue transformar o candidato depois de aprovado', async () => {
    const a = ambiente(); await a.repo.entrar('u-carla'); const antes = a.lerBruto();
    await expect(a.repo.alterarSonda(editarDireito, 0, renomearDireito, (dados) => {
      (dados as DadosAcademicos).graduacoes[0].nome = 'Injeção'; return {};
    })).rejects.toThrow(TypeError);
    expect(a.persistencia.gravar).not.toHaveBeenCalled(); expect(a.lerBruto()).toBe(antes);
  });

  it('não confirma edição sobre estado que mudou durante a validação', async () => {
    const a = ambiente(); await a.repo.entrar('u-carla'); let externo: string | null = null;
    await expect(a.repo.alterarSonda(editarDireito, 0, renomearDireito, () => {
      a.alterarExternamente((dados) => { dados.revisao++; dados.turmas[0].codigo = 'OUTRO'; });
      externo = a.lerBruto(); return {};
    })).rejects.toMatchObject({ codigo: 'REVISAO_OBSOLETA' });
    expect(a.persistencia.gravar).not.toHaveBeenCalled(); expect(a.lerBruto()).toBe(externo);
  });

  it('revalida identidade e atividade imediatamente antes da gravação', async () => {
    const a = ambiente(); await a.repo.entrar('u-carla'); const antes = a.lerBruto();
    await expect(a.repo.alterarSonda(editarDireito, 0, renomearDireito, () => {
      a.sessao.definirUsuarioId('u-admin'); return {};
    })).rejects.toMatchObject({ codigo: 'SESSAO_INVALIDA' });
    expect(a.lerBruto()).toBe(antes); expect(a.persistencia.gravar).not.toHaveBeenCalled();
    await a.repo.entrar('u-carla');
    await expect(a.repo.alterarSonda(editarDireito, 0, renomearDireito, () => {
      a.alterarExternamente((dados) => { dados.usuarios.find((u) => u.id === 'u-carla')!.ativo = false; }); return {};
    })).rejects.toMatchObject({ codigo: 'SESSAO_INVALIDA' });
    expect(a.persistencia.gravar).not.toHaveBeenCalled();
  });

  it('exige autorização de todos os recursos de uma operação de origem/destino', async () => {
    const a = ambiente(); await a.repo.entrar('u-carla'); const preparar = vi.fn(renomearDireito);
    await expect(a.repo.alterarSonda([editarDireito, { acao: 'editar-graduacao', recurso: { tipo: 'graduacao', graduacaoId: 'g-si' } }],
      0, preparar, validarSonda)).rejects.toMatchObject({ codigo: 'ACESSO_NEGADO' });
    expect(preparar).not.toHaveBeenCalled(); expect(a.persistencia.gravar).not.toHaveBeenCalled();
  });

  it('recusa reentrada na mesma instância e permite somente a gravação da operação externa', async () => {
    const a = ambiente(); await a.repo.entrar('u-carla');
    let reentrada: Promise<unknown> | undefined;
    const prepararInterno = vi.fn(renomearDireito);
    await a.repo.alterarSonda(editarDireito, 0, renomearDireito, (dados, anterior) => {
      reentrada = a.repo.alterarSonda(editarDireito, 0, prepararInterno, validarSonda);
      return validarSonda(dados, anterior);
    });
    await expect(reentrada).rejects.toMatchObject({ codigo: 'ALTERACAO_REENTRANTE' });
    expect(prepararInterno).not.toHaveBeenCalled();
    expect(a.persistencia.gravar).toHaveBeenCalledTimes(1);
    expect(JSON.parse(a.lerBruto()!).revisao).toBe(1);
  });

  it.each(['versaoSchema', 'versaoSeed', 'revisao'] as const)('não permite falsificar metadado %s', async (campo) => {
    const a = ambiente(); await a.repo.entrar('u-carla'); const antes = a.lerBruto();
    await expect(a.repo.alterarSonda(editarDireito, 0, (dados) => { dados[campo]++; }, validarSonda)).rejects.toMatchObject({ codigo: 'VALIDACAO_REJEITADA' });
    expect(a.persistencia.gravar).not.toHaveBeenCalled(); expect(a.lerBruto()).toBe(antes);
  });

  it('rejeita transformação/validação assíncrona e resultado não serializável antes de gravar', async () => {
    const a = ambiente(); await a.repo.entrar('u-carla'); const antes = a.lerBruto();
    await expect(a.repo.alterarSonda(editarDireito, 0, async (dados) => { renomearDireito(dados); }, validarSonda)).rejects.toMatchObject({ codigo: 'OPERACAO_ASSINCRONA' });
    await expect(a.repo.alterarSonda(editarDireito, 0, renomearDireito,
      (async () => ({})) as unknown as ValidadorCandidato)).rejects.toMatchObject({ codigo: 'OPERACAO_ASSINCRONA' });
    await expect(a.repo.alterarSonda(editarDireito, 0, () => ({ funcao: () => 1 }), validarSonda)).rejects.toThrow();
    expect(a.persistencia.gravar).not.toHaveBeenCalled(); expect(a.lerBruto()).toBe(antes);
  });

  it('não aceita ausência ou resultado inválido do validador', async () => {
    const a = ambiente(); await a.repo.entrar('u-carla');
    await expect(a.repo.alterarSonda(editarDireito, 0, renomearDireito,
      undefined as unknown as ValidadorCandidato)).rejects.toMatchObject({ codigo: 'VALIDACAO_REJEITADA' });
    await expect(a.repo.alterarSonda(editarDireito, 0, renomearDireito,
      (() => null) as unknown as ValidadorCandidato)).rejects.toMatchObject({ codigo: 'VALIDACAO_REJEITADA' });
    expect(a.persistencia.gravar).not.toHaveBeenCalled();
  });

  it('não toca chaves, versões ou dados da demonstração legada', async () => {
    const legado = '{"versaoSeed":1,"usuarios":[],"cursos":[]}';
    localStorage.setItem('trilha-adaptativa:dados', legado);
    localStorage.setItem('trilha-adaptativa:sessao', 'u-legado');
    const a = ambiente(); await a.repo.entrar('u-carla');
    await a.repo.alterarSonda(editarDireito, 0, renomearDireito, validarSonda);
    expect(localStorage.getItem('trilha-adaptativa:dados')).toBe(legado);
    expect(localStorage.getItem('trilha-adaptativa:sessao')).toBe('u-legado'); expect(localStorage.length).toBe(2);
  });
});
