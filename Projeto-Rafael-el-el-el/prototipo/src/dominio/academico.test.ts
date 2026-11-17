import { describe, expect, it } from 'vitest';
import { criarDisciplina, validarDisciplina, validarGraduacao, validarPeriodoLetivo, validarTurma } from './academico';
import type { Disciplina, Graduacao, PeriodoLetivo, Turma } from './tipos';

const si: Graduacao = { id: 'g-si', codigo: 'SI', nome: 'Sistemas de Informação', descricao: '', area: 'Tecnologia' };
const direito: Graduacao = { ...si, id: 'g-dir', codigo: 'DIR', nome: 'Direito' };

function disciplina(alteracoes: Partial<Disciplina> = {}): Disciplina {
  return {
    id: 'd-alg', graduacaoId: si.id, codigo: 'ALG', nome: 'Algoritmos',
    descricaoCurta: '', descricao: '', nivel: 'Iniciante', status: 'rascunho', topicos: [],
    ...alteracoes,
  };
}

describe('OA — Cadastro de graduações', () => {
  it('aceita cadastro válido e edição com o próprio código', () => {
    expect(validarGraduacao(si, [])).toEqual({});
    expect(validarGraduacao({ ...si, nome: 'Sistemas de Informação atualizado' }, [si])).toEqual({});
  });

  it.each(['codigo', 'nome'] as const)('rejeita %s vazio ou apenas espaços', (campo) => {
    expect(validarGraduacao({ ...si, [campo]: '  ' }, [])).toHaveProperty(campo);
  });

  it('rejeita código de outra graduação sem modificar os cadastros', () => {
    const cadastros = [si];
    const antes = structuredClone(cadastros);
    expect(validarGraduacao({ ...direito, codigo: si.codigo }, cadastros)).toHaveProperty('codigo');
    expect(cadastros).toEqual(antes);
  });
});

describe('OA / GC — Disciplinas de uma graduação', () => {
  it('inicia conteúdo em rascunho e mantém a identidade recebida', () => {
    const { status: _status, topicos: _topicos, ...dados } = disciplina();
    const nova = criarDisciplina(dados);
    expect(nova).toMatchObject({ id: dados.id, graduacaoId: si.id, status: 'rascunho', topicos: [] });
    expect(validarDisciplina(nova, [si], [])).toEqual({});
    expect(nova).not.toHaveProperty('area');
  });

  it.each(['codigo', 'nome'] as const)('rejeita %s obrigatório ausente', (campo) => {
    expect(validarDisciplina(disciplina({ [campo]: ' ' }), [si], [])).toHaveProperty(campo);
  });

  it.each(['', 'g-inexistente'])('rejeita graduação ausente ou inexistente (%s)', (graduacaoId) => {
    expect(validarDisciplina(disciplina({ graduacaoId }), [si], [])).toHaveProperty('graduacaoId');
  });

  it('rejeita código repetido somente na mesma graduação', () => {
    const existente = disciplina();
    expect(validarDisciplina(disciplina({ id: 'd-outra' }), [si], [existente])).toHaveProperty('codigo');
    expect(validarDisciplina(disciplina({ id: 'd-outra', graduacaoId: direito.id }), [si, direito], [existente])).toEqual({});
  });

  it('permite editar a mesma disciplina sem mudar seu ID ou código', () => {
    const existente = disciplina();
    expect(validarDisciplina({ ...existente, nome: 'Algoritmos atualizado' }, [si], [existente])).toEqual({});
  });
});

const periodo: PeriodoLetivo = { id: 'p-26', nome: '2026.2', dataInicio: '2026-08-03', dataFim: '2026-12-18' };
const turma: Turma = { id: 't-a', codigo: 'A', disciplinaId: 'd-alg', periodoLetivoId: periodo.id };

describe('OA — Períodos letivos', () => {
  it('aceita datas válidas, inclusive início e fim no mesmo dia', () => {
    expect(validarPeriodoLetivo(periodo)).toEqual({});
    expect(validarPeriodoLetivo({ ...periodo, dataFim: periodo.dataInicio })).toEqual({});
  });

  it.each(['id', 'nome', 'dataInicio', 'dataFim'] as const)('exige %s', (campo) => {
    expect(validarPeriodoLetivo({ ...periodo, [campo]: ' ' })).toHaveProperty(campo);
  });

  it('rejeita fim anterior ao início', () => {
    expect(validarPeriodoLetivo({ ...periodo, dataFim: '2026-08-02' })).toHaveProperty('dataFim');
  });

  it.each(['2026-02-29', '2026-04-31', '18/12/2026', 'invalida'])('rejeita data civil inválida (%s)', (dataFim) => {
    expect(validarPeriodoLetivo({ ...periodo, dataFim })).toHaveProperty('dataFim');
  });

  it('aceita ano bissexto sem deslocar a data pelo fuso', () => {
    expect(validarPeriodoLetivo({ ...periodo, dataInicio: '2028-02-29', dataFim: '2028-02-29' })).toEqual({});
  });
});

describe('OA — Ofertas de disciplinas em turmas', () => {
  it('aceita turma sem professores ou alunos, sem exigir vínculos antecipados', () => {
    expect(validarTurma(turma, [disciplina()], [periodo], [])).toEqual({});
    expect(turma).not.toHaveProperty('alunos');
    expect(turma).not.toHaveProperty('professores');
  });

  it('rejeita código ausente e referências inexistentes', () => {
    expect(validarTurma({ ...turma, codigo: ' ' }, [], [], [])).toEqual({
      codigo: expect.any(String), disciplinaId: expect.any(String), periodoLetivoId: expect.any(String),
    });
  });

  it('rejeita outra turma com código igual na mesma disciplina e período', () => {
    expect(validarTurma({ ...turma, id: 't-outra' }, [disciplina()], [periodo], [turma])).toHaveProperty('codigo');
    expect(validarTurma({ ...turma }, [disciplina()], [periodo], [turma])).toEqual({});
  });

  it('aceita turmas paralelas, mesmo código em outro período e em outra disciplina', () => {
    const outroPeriodo = { ...periodo, id: 'p-27', nome: '2027.1' };
    const outraDisciplina = disciplina({ id: 'd-bd', codigo: 'BD' });
    for (const candidata of [
      { ...turma, id: 't-b', codigo: 'B' },
      { ...turma, id: 't-27', periodoLetivoId: outroPeriodo.id },
      { ...turma, id: 't-bd', disciplinaId: outraDisciplina.id },
    ]) {
      expect(validarTurma(candidata, [disciplina(), outraDisciplina], [periodo, outroPeriodo], [turma])).toEqual({});
    }
  });
});
