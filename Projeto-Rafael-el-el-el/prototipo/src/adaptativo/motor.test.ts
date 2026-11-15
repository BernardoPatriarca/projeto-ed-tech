import { describe, expect, it } from 'vitest';
import { cursoTeste, questoesTeste, resposta } from '../testes/fixtures';
import type { Resposta } from '../dominio/tipos';
import {
  atualizarDominio,
  calcularEstado,
  deveSugerirRevisao,
  faixaDificuldade,
  proximaQuestao,
  type EstadoTrilha,
} from './motor';

const curso = cursoTeste('mat');
const [fra, dec, por] = curso.topicos.map((t) => t.id);
const questoes = questoesTeste(curso);

/** Respostas corretas suficientes para dominar um tópico (4 fáceis, 2 médias, 1 difícil = 90). */
function dominar(topicoId: string): Resposta[] {
  return [
    ...Array.from({ length: 4 }, () => resposta('mat', topicoId, 'facil', true)),
    resposta('mat', topicoId, 'medio', true),
    resposta('mat', topicoId, 'medio', true),
    resposta('mat', topicoId, 'dificil', true),
  ];
}

describe('Trilha independente por curso', () => {
  it('respostas em Matemática não alteram o estado de Inglês', () => {
    const ingles = cursoTeste('ing', ['Saudações', 'Verbo to be']);
    const respIngles = [resposta('ing', 'ing-t1', 'facil', true)];
    const antes = calcularEstado(ingles, respIngles);
    const todas = [...respIngles, ...dominar(fra)];
    expect(calcularEstado(ingles, todas)).toEqual(antes);
    expect(calcularEstado(curso, todas).topicos[0].dominado).toBe(true);
  });
});

describe('Nível de domínio por tópico', () => {
  it('inicia em 0', () => {
    expect(calcularEstado(curso, []).topicos.map((t) => t.dominio)).toEqual([0, 0, 0]);
  });

  it('acerto aumenta o domínio, mais em questões difíceis', () => {
    expect(atualizarDominio(50, 'facil', true)).toBe(60);
    expect(atualizarDominio(50, 'medio', true)).toBe(65);
    expect(atualizarDominio(50, 'dificil', true)).toBe(70);
  });

  it('erro diminui o domínio, mais em questões fáceis', () => {
    expect(atualizarDominio(50, 'facil', false)).toBe(35);
    expect(atualizarDominio(50, 'medio', false)).toBe(40);
    expect(atualizarDominio(50, 'dificil', false)).toBe(45);
  });

  it('erro com domínio 0 mantém 0 (sem negativo)', () => {
    const estado = calcularEstado(curso, [resposta('mat', fra, 'facil', false)]);
    expect(estado.topicos[0].dominio).toBe(0);
  });

  it('domínio não passa de 100', () => {
    expect(atualizarDominio(95, 'dificil', true)).toBe(100);
  });
});

describe('Dificuldade conforme domínio', () => {
  it.each([
    [0, 'facil'],
    [39, 'facil'],
    [40, 'medio'],
    [55, 'medio'],
    [69, 'medio'],
    [70, 'dificil'],
    [100, 'dificil'],
  ] as const)('domínio %i → %s', (dominio, esperada) => {
    expect(faixaDificuldade(dominio)).toBe(esperada);
  });

  it('domínio 55 recebe questão Média', () => {
    const estado = estadoManual([{ id: fra, dominio: 55 }]);
    expect(proximaQuestao(estado, questoes, [])!.dificuldade).toBe('medio');
  });
});

function estadoManual(topicos: { id: string; dominio: number; dominado?: boolean }[]): EstadoTrilha {
  return {
    cursoId: 'mat',
    topicos: curso.topicos.map((t) => {
      const def = topicos.find((x) => x.id === t.id);
      return {
        topicoId: t.id,
        titulo: t.titulo,
        dominio: def?.dominio ?? 0,
        desbloqueado: Boolean(def),
        dominado: def?.dominado ?? false,
      };
    }),
    progresso: 0,
    concluido: false,
  };
}

describe('Escolha da próxima atividade', () => {
  it('foca no tópico desbloqueado e não dominado de menor domínio', () => {
    const estado = estadoManual([
      { id: fra, dominio: 30 },
      { id: dec, dominio: 60 },
    ]);
    expect(proximaQuestao(estado, questoes, [])!.topicoId).toBe(fra);
  });

  it('ignora tópicos dominados e bloqueados', () => {
    const estado = estadoManual([
      { id: fra, dominio: 90, dominado: true },
      { id: dec, dominio: 60 },
    ]);
    expect(proximaQuestao(estado, questoes, [])!.topicoId).toBe(dec);
  });

  it('evita repetir a última questão respondida', () => {
    const r = resposta('mat', fra, 'facil', false, { questaoId: `${fra}-facil-1` });
    const estado = calcularEstado(curso, [r]);
    expect(proximaQuestao(estado, questoes, [r])!.questao.id).toBe(`${fra}-facil-2`);
  });

  it('sem questão inédita, reutiliza a menos recente da mesma dificuldade', () => {
    const r1 = resposta('mat', fra, 'facil', false, { questaoId: `${fra}-facil-2` });
    const r2 = resposta('mat', fra, 'facil', false, { questaoId: `${fra}-facil-1` });
    const r3 = resposta('mat', fra, 'facil', false, { questaoId: `${fra}-facil-2` });
    const rs = [r1, r2, r3];
    expect(proximaQuestao(calcularEstado(curso, rs), questoes, rs)!.questao.id).toBe(`${fra}-facil-1`);
  });

  it('retorna null quando o curso está concluído', () => {
    const rs = [...dominar(fra), ...dominar(dec), ...dominar(por)];
    expect(proximaQuestao(calcularEstado(curso, rs), questoes, rs)).toBeNull();
  });
});

describe('Desbloqueio de tópicos', () => {
  it('na matrícula (sem respostas) apenas o primeiro tópico está desbloqueado', () => {
    expect(calcularEstado(curso, []).topicos.map((t) => t.desbloqueado)).toEqual([true, false, false]);
  });

  it('domínio ≥ 80 marca o tópico como dominado e desbloqueia o seguinte', () => {
    const quase = dominar(fra).slice(0, 6); // 70
    const antes = calcularEstado(curso, quase);
    expect(antes.topicos[0]).toMatchObject({ dominio: 70, dominado: false });
    expect(antes.topicos[1].desbloqueado).toBe(false);

    const depois = calcularEstado(curso, dominar(fra));
    expect(depois.topicos[0]).toMatchObject({ dominio: 90, dominado: true });
    expect(depois.topicos[1].desbloqueado).toBe(true);
    expect(depois.topicos[2].desbloqueado).toBe(false);
  });

  it('a ordem dos tópicos define a sequência de desbloqueio (reordenação)', () => {
    const reordenado = { ...curso, topicos: [curso.topicos[1], curso.topicos[0], curso.topicos[2]] };
    const estado = calcularEstado(reordenado, []);
    expect(estado.topicos[0]).toMatchObject({ topicoId: dec, desbloqueado: true });
    expect(estado.topicos[1]).toMatchObject({ topicoId: fra, desbloqueado: false });
  });
});

describe('Revisão sugerida', () => {
  it('sugere revisão após dois erros seguidos no mesmo tópico', () => {
    const um = [resposta('mat', fra, 'facil', true), resposta('mat', fra, 'facil', false)];
    expect(deveSugerirRevisao(um, fra)).toBe(false);
    const dois = [...um, resposta('mat', fra, 'facil', false)];
    expect(deveSugerirRevisao(dois, fra)).toBe(true);
  });

  it('um acerto interrompe a contagem', () => {
    const rs = [resposta('mat', fra, 'facil', false), resposta('mat', fra, 'facil', true), resposta('mat', fra, 'facil', false)];
    expect(deveSugerirRevisao(rs, fra)).toBe(false);
  });
});

describe('Conclusão do curso', () => {
  it('progresso é a porcentagem de tópicos dominados', () => {
    expect(calcularEstado(curso, dominar(fra)).progresso).toBe(33);
  });

  it('dominar o último tópico leva a 100% e marca o curso como concluído', () => {
    const doisTopicos = [...dominar(fra), ...dominar(dec)];
    expect(calcularEstado(curso, doisTopicos).concluido).toBe(false);
    const estado = calcularEstado(curso, [...doisTopicos, ...dominar(por)]);
    expect(estado).toMatchObject({ progresso: 100, concluido: true });
  });
});
