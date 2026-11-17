import { describe, expect, it } from 'vitest';
import { adicionarHistoricoSintetico, ambienteComandos, recusaSemEfeitos } from '../testes/ambiente-comandos-academicos';

describe('2.8 — [OA] Vínculos de professores às turmas; [PA] Escopo de gestão da coordenação', () => {
  it('permite vários professores por turma e várias turmas por professor, sem duplicações', async () => {
    const a = ambienteComandos(); await a.repo.entrar('u-admin');
    await a.repo.definirVinculoProfessor({ turmaId: 't-26' }, { professorId: 'u-prof' }, true, 0);
    await a.repo.definirVinculoProfessor({ turmaId: 't-27' }, { professorId: 'u-prof' }, true, 1);
    await a.repo.definirVinculoProfessor({ turmaId: 't-dir' }, { professorId: 'u-prof' }, true, 2);
    expect(a.ler().vinculosProfessor.filter((v) => v.professorId === 'u-prof')).toHaveLength(3);
    expect(a.ler().vinculosProfessor.filter((v) => v.turmaId === 't-26')).toHaveLength(2);
    const antes = a.bruto();
    expect(await a.repo.definirVinculoProfessor({ turmaId: 't-26' }, { professorId: 'u-prof' }, true, 3)).toMatchObject({ alterado: false, vinculado: true });
    expect(a.bruto()).toBe(antes);
  });

  it('Coordenador atribui e remove somente no seu curso, sem obter autoria docente por coordenar', async () => {
    const a = ambienteComandos(); await a.repo.entrar('u-carla');
    expect(await a.repo.definirVinculoProfessor({ turmaId: 't-dir', graduacaoId: 'g-dir' }, { professorId: 'u-prof' }, true, 0)).toMatchObject({ alterado: true });
    await recusaSemEfeitos(a, () => a.repo.definirVinculoProfessor({ turmaId: 't-26' }, { professorId: 'u-prof' }, true, 1), 'ACESSO_NEGADO');
    await recusaSemEfeitos(a, () => a.repo.definirVinculoProfessor({ turmaId: 't-26' }, { professorId: 'u-carla' }, false, 1), 'ACESSO_NEGADO');
    expect(await a.repo.definirVinculoProfessor({ turmaId: 't-dir' }, { professorId: 'u-prof' }, false, 1)).toMatchObject({ alterado: true, vinculado: false });
  });

  it.each([null, 'u-prof', 'u-coord', 'u-ana'])('nega gestão docente sem sessão/função/vínculo (%s)', async (autor) => {
    const a = ambienteComandos(); if (autor) await a.repo.entrar(autor);
    await recusaSemEfeitos(a, () => a.repo.definirVinculoProfessor({ turmaId: 't-dir' }, { professorId: 'u-prof' }, true, 0), autor ? 'ACESSO_NEGADO' : 'SEM_SESSAO');
  });

  it.each(['inexistente', 'u-ana', 'u-coord', 'u-prof'])('rejeita pessoa inexistente, sem função Professor ou inativa (%s)', async (professorId) => {
    const a = ambienteComandos((d) => { d.usuarios.find((u) => u.id === 'u-prof')!.ativo = false; }); await a.repo.entrar('u-admin');
    await recusaSemEfeitos(a, () => a.repo.definirVinculoProfessor({ turmaId: 't-dir' }, { professorId }, true, 0), 'VALIDACAO_REJEITADA');
  });

  it('preserva histórico e demais vínculos na repetição e remoção; remover inexistente é idempotente', async () => {
    const a = ambienteComandos((d) => {
      adicionarHistoricoSintetico(d);
      d.vinculosProfessor.push({ professorId: 'u-carla', turmaId: 't-27' });
    });
    await a.repo.entrar('u-admin'); const antes = a.bruto();
    await a.repo.definirVinculoProfessor({ turmaId: 't-26' }, { professorId: 'u-carla' }, true, 0);
    expect(a.bruto()).toBe(antes); expect(a.persistencia.gravar).not.toHaveBeenCalled();
    await a.repo.definirVinculoProfessor({ turmaId: 't-26' }, { professorId: 'u-carla' }, false, 0);
    expect(a.ler().respostas).toEqual(JSON.parse(antes).respostas);
    expect(a.ler().vinculosProfessor).toEqual([{ professorId: 'u-carla', turmaId: 't-27' }]);
    const removido = a.bruto();
    expect(await a.repo.definirVinculoProfessor({ turmaId: 't-26' }, { professorId: 'u-carla' }, false, 1)).toMatchObject({ alterado: false });
    expect(a.bruto()).toBe(removido);
  });

  it('permite retirar vínculo ineficaz de pessoa desativada sem apagar outros dados', async () => {
    const a = ambienteComandos((d) => { d.usuarios.find((u) => u.id === 'u-carla')!.ativo = false; });
    await a.repo.entrar('u-admin');
    await a.repo.definirVinculoProfessor({ turmaId: 't-26' }, { professorId: 'u-carla' }, false, 0);
    expect(a.ler().vinculosProfessor).toEqual([]);
  });

  it('nega turma inexistente, pais incompatíveis, payload excedente e revisão obsoleta', async () => {
    const a = ambienteComandos(); await a.repo.entrar('u-admin');
    await recusaSemEfeitos(a, () => a.repo.definirVinculoProfessor({ turmaId: 'inexistente' }, { professorId: 'u-prof' }, true, 0));
    await recusaSemEfeitos(a, () => a.repo.definirVinculoProfessor({ turmaId: 't-dir', graduacaoId: 'g-si' }, { professorId: 'u-prof' }, true, 0), 'ACESSO_NEGADO');
    await recusaSemEfeitos(a, () => a.repo.definirVinculoProfessor({ turmaId: 't-dir' }, { professorId: 'u-prof', funcoes: ['admin'] } as { professorId: string }, true, 0), 'VALIDACAO_REJEITADA');
    await recusaSemEfeitos(a, () => a.repo.definirVinculoProfessor({ turmaId: 't-dir' }, { professorId: 'u-prof' }, true, 1), 'REVISAO_OBSOLETA');
  });
});
