import { describe, expect, it } from 'vitest';
import { somarDias } from '../dominio/datas';
import type { Resposta } from '../dominio/tipos';
import { cursoTeste, resposta } from '../testes/fixtures';
import { conquistasCurso, sequenciaDias, xpCurso } from './gamificacao';

const HOJE = '2026-03-16';
const dia = (n: number) => somarDias(HOJE, n);

describe('XP por curso', () => {
  it('concede 10/20/30 por acerto em Fácil/Médio/Difícil e nada por erro', () => {
    const rs = [
      resposta('mat', 't', 'facil', true),
      resposta('mat', 't', 'medio', true),
      resposta('mat', 't', 'dificil', true),
      resposta('mat', 't', 'dificil', false),
    ];
    expect(xpCurso(rs, 'mat')).toBe(60);
  });

  it('acerto difícil em Matemática soma 30 só a esse curso', () => {
    const base = [resposta('mat', 't', 'facil', true), resposta('ing', 'u', 'facil', true)];
    const depois = [...base, resposta('mat', 't', 'dificil', true)];
    expect(xpCurso(depois, 'mat') - xpCurso(base, 'mat')).toBe(30);
    expect(xpCurso(depois, 'ing')).toBe(xpCurso(base, 'ing'));
  });
});

describe('Sequência de dias de estudo', () => {
  const tresDias = [-3, -2, -1].map((n) => resposta('mat', 't', 'facil', true, { data: dia(n) }));

  it('sequência de 3 dias segue valendo no dia seguinte antes de estudar', () => {
    expect(sequenciaDias(tresDias, 'mat', HOJE)).toBe(3);
  });

  it('responder no dia seguinte leva a sequência a 4', () => {
    const rs = [...tresDias, resposta('mat', 't', 'facil', false, { data: HOJE })];
    expect(sequenciaDias(rs, 'mat', HOJE)).toBe(4);
  });

  it('um dia inteiro sem atividade zera a sequência', () => {
    expect(sequenciaDias(tresDias, 'mat', dia(1))).toBe(0);
  });

  it('atividade em outro curso não mantém a sequência', () => {
    const rs = [...tresDias, resposta('ing', 'u', 'facil', true, { data: HOJE })];
    expect(sequenciaDias(rs, 'mat', dia(1))).toBe(0);
    expect(sequenciaDias(rs, 'ing', HOJE)).toBe(1);
  });
});

describe('Conquistas', () => {
  const curso = cursoTeste('mat', ['A', 'B']);
  const [a, b] = curso.topicos.map((t) => t.id);
  const dominar = (topicoId: string, data = HOJE): Resposta[] => [
    ...Array.from({ length: 4 }, () => resposta('mat', topicoId, 'facil', true, { data })),
    resposta('mat', topicoId, 'medio', true, { data }),
    resposta('mat', topicoId, 'medio', true, { data }),
    resposta('mat', topicoId, 'dificil', true, { data }),
  ];
  const ids = (rs: Resposta[]) => conquistasCurso(curso, rs).map((c) => c.id);

  it('primeira questão respondida', () => {
    expect(ids([])).toEqual([]);
    expect(ids([resposta('mat', a, 'facil', false)])).toEqual(['primeira-questao']);
  });

  it('primeiro tópico dominado', () => {
    expect(ids(dominar(a))).toEqual(['primeira-questao', 'primeiro-topico']);
  });

  it('cada conquista é concedida uma única vez por curso', () => {
    const rs = [...dominar(a), ...dominar(b)];
    const lista = ids(rs);
    expect(lista.filter((id) => id === 'primeiro-topico')).toHaveLength(1);
    expect(lista.filter((id) => id === 'primeira-questao')).toHaveLength(1);
    expect(new Set(lista).size).toBe(lista.length);
  });

  it('curso concluído ao dominar todos os tópicos', () => {
    expect(ids([...dominar(a), ...dominar(b)])).toContain('curso-concluido');
  });

  it('sequência de 7 dias', () => {
    const seis = [-6, -5, -4, -3, -2, -1].map((n) => resposta('mat', a, 'facil', false, { data: dia(n) }));
    expect(ids(seis)).not.toContain('sequencia-7');
    const sete = [...seis, resposta('mat', a, 'facil', false, { data: HOJE })];
    expect(conquistasCurso(curso, sete).find((c) => c.id === 'sequencia-7')?.data).toBe(HOJE);
  });

  it('conquistas são por curso', () => {
    const rs = [...dominar(a), resposta('ing', 'x', 'facil', true)];
    const ingles = cursoTeste('ing', ['X']);
    expect(conquistasCurso(ingles, rs).map((c) => c.id)).toEqual(['primeira-questao']);
  });
});
