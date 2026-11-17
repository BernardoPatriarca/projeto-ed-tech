import { ConsultasAcademicas } from '../dados/consultas-academicas';
import type { SessaoAcademica } from '../dados/repositorio-academico';
import type { DadosAcademicos } from '../dominio/tipos';
import { adicionarHistoricoSintetico, ambienteComandos } from './ambiente-comandos-academicos';

/** Históricos sintéticos com marcadores privados, sem alterar o seed ou chaves reais. */
export function prepararConsultas(dados: DadosAcademicos) {
  adicionarHistoricoSintetico(dados);
  dados.disciplinas[0].topicos[0].materiais.push({ id: 'mat-privado', tipo: 'texto', titulo: 'Aula', conteudo: 'MATERIAL_RESTRITO' });
  dados.usuarios.push(
    { id: 'u-bruno', nome: 'Bruno', email: 'EMAIL_PRIVADO_B', ativo: true, funcoes: ['aluno'] },
    { id: 'u-inativo', nome: 'Inativo', email: 'inativo@exemplo.com', ativo: false, funcoes: ['aluno', 'professor', 'coordenador', 'responsavel'] },
  );
  dados.turmas.push({ id: 't-b', codigo: 'B', disciplinaId: 'd-alg', periodoLetivoId: 'p-26' });
  dados.matriculas.push(
    { id: 'm-bruno-b', alunoId: 'u-bruno', turmaId: 't-b', data: dados.dataVirtual },
    { id: 'm-ana-b', alunoId: 'u-ana', turmaId: 't-b', data: dados.dataVirtual },
    { id: 'm-ana-dir', alunoId: 'u-ana', turmaId: 't-dir', data: dados.dataVirtual },
  );
  dados.respostas.push({ ...structuredClone(dados.respostas[0]), id: 'RESPOSTA_PRIVADA_B', matriculaId: 'm-bruno-b',
    conteudoOriginal: { ...dados.respostas[0].conteudoOriginal, explicacao: 'HISTORICO_PRIVADO_B' } });
  adicionarHistoricoSintetico(dados, 'm-ana-dir');
  dados.usuarios.find((u) => u.id === 'u-prof')!.funcoes = ['professor', 'admin'];
}

export function ambienteConsultas(preparar?: (dados: DadosAcademicos) => void) {
  const a = ambienteComandos((dados) => { prepararConsultas(dados); preparar?.(dados); });
  const repo = new ConsultasAcademicas(a.persistencia, a.sessao, a.gerarId);
  /** Segunda sessão sobre o mesmo armazenamento para revogação com editor realmente aberto. */
  function outraSessao() {
    let usuarioId: string | null = null;
    const sessao: SessaoAcademica = { obterUsuarioId: () => usuarioId, definirUsuarioId: (id) => { usuarioId = id; } };
    return new ConsultasAcademicas(a.persistencia, sessao, a.gerarId);
  }
  return { ...a, repo, outraSessao };
}
