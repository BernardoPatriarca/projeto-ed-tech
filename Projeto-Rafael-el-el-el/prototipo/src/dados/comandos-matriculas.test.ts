import { describe, expect, it, vi } from 'vitest';
import { adicionarHistoricoSintetico, ambienteComandos, recusaSemEfeitos } from '../testes/ambiente-comandos-academicos';
import { podeExecutar } from '../dominio/autorizacao';

describe('2.7 — [OA] Matrícula administrativa, Unicidade; [AA]/[GA] independência por período', () => {
  it.each(['u-admin', 'u-carla'])('%s matricula no escopo sem exigir publicação e sem copiar conteúdo/histórico', async (autor) => {
    const a = ambienteComandos(); await a.repo.entrar(autor); const antes = a.ler();
    const resultado = await a.repo.matricular({ turmaId: 't-dir' }, { alunoId: 'u-ana' }, 0);
    expect(resultado).toMatchObject({ jaExistia: false, matricula: { alunoId: 'u-ana', turmaId: 't-dir', data: antes.dataVirtual } });
    expect(a.ler()).toEqual({ ...antes, revisao: 1, matriculas: [...antes.matriculas, resultado.matricula] });
    expect(a.ler().disciplinas.find((d) => d.id === 'd-dir')!.status).toBe('rascunho');
    for (const acao of ['consultar-estudo', 'responder'] as const) {
      expect(podeExecutar(a.ler(), 'u-ana', { acao, recurso: { tipo: 'matricula', matriculaId: resultado.matricula.id } })).toBe(false);
    }
  });

  it.each([null, 'u-ana', 'u-prof', 'u-coord'])('nega matrícula sem sessão/função/vínculo (%s)', async (autor) => {
    const a = ambienteComandos(); if (autor) await a.repo.entrar(autor);
    await recusaSemEfeitos(a, () => a.repo.matricular({ turmaId: 't-dir' }, { alunoId: 'u-ana' }, 0), autor ? 'ACESSO_NEGADO' : 'SEM_SESSAO');
  });

  it('nega coordenação de outro curso, turma inexistente e pais incompatíveis', async () => {
    const a = ambienteComandos(); await a.repo.entrar('u-carla');
    await recusaSemEfeitos(a, () => a.repo.matricular({ turmaId: 't-26' }, { alunoId: 'u-ana' }, 0), 'ACESSO_NEGADO');
    await a.repo.entrar('u-admin');
    await recusaSemEfeitos(a, () => a.repo.matricular({ turmaId: 'inexistente' }, { alunoId: 'u-ana' }, 0));
    await recusaSemEfeitos(a, () => a.repo.matricular({ turmaId: 't-dir', graduacaoId: 'g-si' }, { alunoId: 'u-ana' }, 0), 'ACESSO_NEGADO');
  });

  it.each(['inexistente', 'u-prof', 'u-carla', 'u-ana'])('rejeita aluno inexistente, sem função ou inativo (%s)', async (alunoId) => {
    const a = ambienteComandos((d) => { d.usuarios.find((u) => u.id === 'u-ana')!.ativo = false; });
    await a.repo.entrar('u-admin');
    await recusaSemEfeitos(a, () => a.repo.matricular({ turmaId: 't-dir' }, { alunoId }, 0), 'VALIDACAO_REJEITADA');
  });

  it.each(['u-admin', 'u-carla'])('repetição por %s informa duplicidade sem gravar, mudar revisão ou perder histórico', async (autor) => {
    const a = ambienteComandos((d) => {
      d.matriculas.push({ id: 'm-ana-dir', alunoId: 'u-ana', turmaId: 't-dir', data: '2026-11-01' });
      adicionarHistoricoSintetico(d, 'm-ana-dir');
    });
    await a.repo.entrar(autor); const antes = a.bruto(), original = a.ler().matriculas.find((m) => m.id === 'm-ana-dir');
    expect(await a.repo.matricular({ turmaId: 't-dir' }, { alunoId: 'u-ana' }, 0)).toEqual({ matricula: original, jaExistia: true });
    expect(a.bruto()).toBe(antes); expect(a.persistencia.gravar).not.toHaveBeenCalled(); expect(a.gerarId).not.toHaveBeenCalled();
  });

  it('nova matrícula em outro período não recebe as respostas ou XP da oferta anterior', async () => {
    const a = ambienteComandos((d) => {
      d.matriculas = d.matriculas.filter((m) => m.id !== 'm-ana-27');
      adicionarHistoricoSintetico(d);
    });
    await a.repo.entrar('u-admin'); const antes = a.ler();
    const { matricula } = await a.repo.matricular({ turmaId: 't-27' }, { alunoId: 'u-ana' }, 0);
    expect(matricula.id).not.toBe('m-ana-26');
    expect(a.ler().respostas).toEqual(antes.respostas);
    expect(a.ler().respostas.filter((r) => r.matriculaId === matricula.id)).toEqual([]);
    expect(a.ler().matriculas).toEqual([...antes.matriculas, matricula]);
  });

  it('rejeita ID repetido, formulário obsoleto e injeção de autor/estado de estudo', async () => {
    const a = ambienteComandos(); await a.repo.entrar('u-admin');
    a.gerarId.mockReturnValueOnce('m-ana-26');
    await recusaSemEfeitos(a, () => a.repo.matricular({ turmaId: 't-dir' }, { alunoId: 'u-ana' }, 0), 'VALIDACAO_REJEITADA');
    await recusaSemEfeitos(a, () => a.repo.matricular({ turmaId: 't-dir' }, { alunoId: 'u-ana' }, 1), 'REVISAO_OBSOLETA');
    await recusaSemEfeitos(a, () => a.repo.matricular({ turmaId: 't-dir' }, { alunoId: 'u-ana', autorId: 'u-admin', xp: 30 } as { alunoId: string }, 0), 'VALIDACAO_REJEITADA');
  });

  it('falha ao persistir matrícula não publica candidato nem avança revisão', async () => {
    const a = ambienteComandos(); await a.repo.entrar('u-admin'); const antes = a.bruto();
    vi.mocked(a.persistencia.gravar).mockImplementationOnce(() => { throw new Error('Quota'); });
    await expect(a.repo.matricular({ turmaId: 't-dir' }, { alunoId: 'u-ana' }, 0)).rejects.toMatchObject({ codigo: 'FALHA_PERSISTENCIA' });
    expect(a.bruto()).toBe(antes);
  });
});
