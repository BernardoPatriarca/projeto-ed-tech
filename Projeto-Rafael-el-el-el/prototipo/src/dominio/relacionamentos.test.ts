import { describe, expect, it } from 'vitest';
import { validarMatricula, validarVinculoCoordenador, validarVinculoProfessor, validarVinculoResponsavel } from './academico';
import type { Graduacao, Matricula, Turma } from './tipos';

const pessoas = [{ id: 'aluno' }, { id: 'professor' }, { id: 'coordenador' }, { id: 'responsavel' }];
const turmas: Turma[] = [
  { id: 't-a', codigo: 'A', disciplinaId: 'd-alg', periodoLetivoId: 'p-26' },
  { id: 't-b', codigo: 'A', disciplinaId: 'd-alg', periodoLetivoId: 'p-27' },
];
const graduacoes: Graduacao[] = [{ id: 'g-si', codigo: 'SI', nome: 'Sistemas de Informação', descricao: '', area: '' }];
const matricula: Matricula = { id: 'm-1', alunoId: 'aluno', turmaId: 't-a', data: '2026-11-17' };

describe('OA — Unicidade da matrícula', () => {
  it('valida uma matrícula nova somente com referências existentes', () => {
    expect(validarMatricula(matricula, pessoas, turmas, [])).toEqual({ erros: {}, existente: undefined });
    expect(validarMatricula(matricula, [], [], []).erros).toEqual({ alunoId: expect.any(String), turmaId: expect.any(String) });
  });

  it('identifica matrícula duplicada pelo par, devolvendo a identidade original sem alterar dados', () => {
    const existentes = [matricula];
    const antes = structuredClone(existentes);
    const resultado = validarMatricula({ ...matricula, id: 'm-nova', data: '2026-11-18' }, pessoas, turmas, existentes);
    expect(resultado.erros).toEqual({});
    expect(resultado.existente).toBe(matricula);
    expect(resultado.existente?.id).toBe('m-1');
    expect(existentes).toEqual(antes);
  });

  it('não confunde nova oferta ou outro aluno com uma matrícula existente', () => {
    expect(validarMatricula({ ...matricula, turmaId: 't-b' }, pessoas, turmas, [matricula]).existente).toBeUndefined();
    expect(validarMatricula({ ...matricula, alunoId: 'aluno-2' }, [...pessoas, { id: 'aluno-2' }], turmas, [matricula]).existente).toBeUndefined();
  });
});

describe('OA / PA — Referências e pares únicos dos vínculos', () => {
  it('professor: valida referências, reconhece duplicação e permite várias turmas', () => {
    const vinculo = { professorId: 'professor', turmaId: 't-a' };
    expect(validarVinculoProfessor(vinculo, [], [], []).erros).toEqual({ professorId: expect.any(String), turmaId: expect.any(String) });
    expect(validarVinculoProfessor({ ...vinculo }, pessoas, turmas, [vinculo]).existente).toBe(vinculo);
    expect(validarVinculoProfessor({ ...vinculo, turmaId: 't-b' }, pessoas, turmas, [vinculo])).toEqual({ erros: {}, existente: undefined });
    expect(vinculo).toEqual({ professorId: 'professor', turmaId: 't-a' });
  });

  it('coordenador: valida pessoa e graduação e mantém o vínculo original repetido', () => {
    const vinculo = { coordenadorId: 'coordenador', graduacaoId: 'g-si' };
    expect(validarVinculoCoordenador(vinculo, [], [], []).erros).toEqual({ coordenadorId: expect.any(String), graduacaoId: expect.any(String) });
    expect(validarVinculoCoordenador({ ...vinculo }, pessoas, graduacoes, [vinculo]).existente).toBe(vinculo);
    const outra = { ...graduacoes[0], id: 'g-dir', codigo: 'DIR' };
    expect(validarVinculoCoordenador({ ...vinculo, graduacaoId: outra.id }, pessoas, [...graduacoes, outra], [vinculo])).toEqual({ erros: {}, existente: undefined });
  });

  it('responsável: valida as duas pessoas e preserva um par já existente', () => {
    const vinculo = { responsavelId: 'responsavel', alunoId: 'aluno' };
    expect(validarVinculoResponsavel(vinculo, [], []).erros).toEqual({ responsavelId: expect.any(String), alunoId: expect.any(String) });
    expect(validarVinculoResponsavel({ ...vinculo }, pessoas, [vinculo]).existente).toBe(vinculo);
    expect(validarVinculoResponsavel(vinculo, pessoas, [])).toEqual({ erros: {}, existente: undefined });
  });
});
