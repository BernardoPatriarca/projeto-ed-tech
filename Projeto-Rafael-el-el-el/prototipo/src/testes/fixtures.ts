import type { Curso, Dificuldade, Questao, Resposta } from '../dominio/tipos';

export function cursoTeste(id = 'c1', titulos = ['Frações', 'Decimais', 'Porcentagem']): Curso {
  return {
    id,
    titulo: `Curso ${id}`,
    descricaoCurta: '',
    descricao: '',
    area: 'Matemática',
    nivel: 'Iniciante',
    status: 'publicado',
    topicos: titulos.map((titulo, i) => ({ id: `${id}-t${i + 1}`, titulo, materiais: [] })),
  };
}

/** Duas questões por nível em cada tópico. */
export function questoesTeste(curso: Curso): Questao[] {
  const qs: Questao[] = [];
  for (const t of curso.topicos) {
    for (const dificuldade of ['facil', 'medio', 'dificil'] as Dificuldade[]) {
      for (const n of [1, 2]) {
        qs.push({
          id: `${t.id}-${dificuldade}-${n}`,
          cursoId: curso.id,
          topicoId: t.id,
          enunciado: `${t.titulo} ${dificuldade} ${n}`,
          alternativas: ['a', 'b'],
          correta: 0,
          explicacao: 'porque sim',
          dificuldade,
        });
      }
    }
  }
  return qs;
}

let momento = 0;
export function resposta(
  cursoId: string,
  topicoId: string,
  dificuldade: Dificuldade,
  acertou: boolean,
  extra: Partial<Resposta> = {},
): Resposta {
  momento++;
  return {
    id: `r${momento}`,
    alunoId: 'aluno',
    cursoId,
    topicoId,
    questaoId: `${topicoId}-${dificuldade}-1`,
    dificuldade,
    alternativa: acertou ? 0 : 1,
    acertou,
    data: '2026-03-16',
    momento,
    ...extra,
  };
}
