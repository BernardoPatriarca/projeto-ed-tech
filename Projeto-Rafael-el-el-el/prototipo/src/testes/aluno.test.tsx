import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { calcularEstado, proximaQuestao } from '../adaptativo/motor';
import type { Repositorio } from '../dados/repositorio';
import { filtrarCatalogo } from '../catalogo/filtro';
import { criarSeed } from '../dados/seed';
import { renderizarApp } from './renderizar';

describe('catálogo', () => {
  it('lista só cursos publicados (rascunho não aparece)', async () => {
    await renderizarApp('/aluno/catalogo', 'u-bruno');
    expect(await screen.findByRole('link', { name: 'Matemática Básica' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inglês Inicial' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lógica de Programação' })).toBeInTheDocument();
    expect(screen.queryByText('Geometria Plana')).not.toBeInTheDocument();
  });

  it('filtra por área', async () => {
    const { usuario } = await renderizarApp('/aluno/catalogo', 'u-bruno');
    await usuario.selectOptions(await screen.findByLabelText('Área'), 'Matemática');
    expect(screen.getByRole('link', { name: 'Matemática Básica' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Inglês Inicial' })).not.toBeInTheDocument();
  });

  it('busca sem resultados mostra a mensagem', async () => {
    const { usuario } = await renderizarApp('/aluno/catalogo', 'u-bruno');
    await usuario.type(await screen.findByLabelText('Buscar pelo título'), 'astronomia');
    expect(screen.getByText(/Nenhum curso encontrado/)).toBeInTheDocument();
  });

  it('filtro: busca ignora acentos e maiúsculas e respeita nível', () => {
    const { cursos } = criarSeed();
    expect(filtrarCatalogo(cursos, { texto: 'INGLES', area: '', nivel: '' }).map((c) => c.id)).toEqual(['c-ing']);
    expect(filtrarCatalogo(cursos, { texto: '', area: '', nivel: 'Intermediário' })).toEqual([]);
  });
});

describe('matrícula e meus cursos', () => {
  it('matricular cria trilha com o primeiro tópico desbloqueado e progresso 0%', async () => {
    const { usuario, rotaAtual } = await renderizarApp('/aluno/cursos/c-ing', 'u-bruno');
    await usuario.click(await screen.findByRole('button', { name: 'Matricular' }));
    await waitFor(() => expect(rotaAtual()).toBe('/aluno/cursos/c-ing/trilha'));
    const topicos = within(screen.getByRole('list', { name: '' }).closest('ol') ?? document.body);
    expect(screen.getByText('Saudações').closest('li')).toHaveTextContent('Desbloqueado');
    expect(screen.getByText('Números').closest('li')).toHaveTextContent('Bloqueado');
    expect(topicos).toBeDefined();
    await usuario.click(screen.getByRole('link', { name: 'Meus cursos' }));
    const cartao = (await screen.findByRole('heading', { name: 'Inglês Inicial' })).closest('li')!;
    expect(within(cartao).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('já matriculado: o detalhe oferece "Continuar" e não "Matricular"', async () => {
    await renderizarApp('/aluno/cursos/c-mat', 'u-ana');
    expect(await screen.findByRole('link', { name: 'Continuar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Matricular' })).not.toBeInTheDocument();
  });

  it('o repositório não duplica matrícula', async () => {
    const { repo } = await renderizarApp('/aluno', 'u-ana');
    await repo.matricular('u-ana', 'c-mat');
    const dados = await repo.obterDados();
    expect(dados.matriculas.filter((m) => m.alunoId === 'u-ana' && m.cursoId === 'c-mat')).toHaveLength(1);
  });

  it('não é possível matricular em curso rascunho', async () => {
    const { repo } = await renderizarApp('/aluno', 'u-ana');
    await expect(repo.matricular('u-ana', 'c-geo')).rejects.toThrow();
  });
});

async function questaoAtual(repo: Repositorio, alunoId: string, cursoId: string) {
  const d = await repo.obterDados();
  const curso = d.cursos.find((c) => c.id === cursoId)!;
  const rs = d.respostas.filter((r) => r.alunoId === alunoId && r.cursoId === cursoId);
  return proximaQuestao(calcularEstado(curso, rs), d.questoes, rs)!.questao;
}

describe('trilha e sessão adaptativa', () => {
  it('trilha exibe XP, sequência e conquistas do curso', async () => {
    await renderizarApp('/aluno/cursos/c-mat/trilha', 'u-ana');
    const indicadores = await screen.findByRole('region', { name: 'Indicadores do curso' });
    expect(indicadores).toHaveTextContent('160');
    expect(indicadores).toHaveTextContent('3 dias');
    expect(screen.getByText('Primeiro tópico dominado').closest('li')).toHaveClass('obtida');
    expect(screen.getByText('Curso concluído').closest('li')).toHaveClass('pendente');
  });

  it('responder → feedback imediato com resultado, explicação e variação de domínio', async () => {
    const { repo, usuario } = await renderizarApp('/aluno/cursos/c-mat/sessao', 'u-ana');
    const q = await questaoAtual(repo, 'u-ana', 'c-mat');
    expect(await screen.findByRole('heading', { name: q.enunciado })).toBeInTheDocument();
    await usuario.click(screen.getByLabelText(q.alternativas[q.correta]));
    await usuario.click(screen.getByRole('button', { name: 'Responder' }));
    expect(await screen.findByText('✔ Você acertou!')).toBeInTheDocument();
    expect(screen.getByText(q.explicacao)).toBeInTheDocument();
    expect(screen.getByText(/Domínio em Decimais: 10 →/)).toHaveTextContent('20 (+10)');
    expect(screen.getByText(/\+10 XP/)).toBeInTheDocument();
  });

  it('após erro mostra a alternativa correta; dois erros seguidos sugerem revisão', async () => {
    const { repo, usuario } = await renderizarApp('/aluno/cursos/c-mat/sessao', 'u-ana');
    for (let i = 0; i < 2; i++) {
      const q = await questaoAtual(repo, 'u-ana', 'c-mat');
      await usuario.click(await screen.findByLabelText(q.alternativas[(q.correta + 1) % q.alternativas.length]));
      await usuario.click(screen.getByRole('button', { name: 'Responder' }));
      expect(await screen.findByText('✘ Você errou.')).toBeInTheDocument();
      expect(screen.getByText('Alternativa correta:')).toHaveTextContent(q.alternativas[q.correta]);
      if (i === 0) {
        expect(screen.queryByRole('link', { name: /Revisar materiais/ })).not.toBeInTheDocument();
        await usuario.click(screen.getByRole('button', { name: 'Próxima questão' }));
      }
    }
    expect(screen.getByRole('link', { name: 'Revisar materiais de Decimais' })).toHaveAttribute(
      'href',
      '/aluno/cursos/c-mat/topicos/t-dec',
    );
  });

  it('acertando até dominar o tópico, ele é dominado e o seguinte é desbloqueado', async () => {
    const { repo, usuario } = await renderizarApp('/aluno/cursos/c-mat/sessao', 'u-ana');
    for (let i = 0; i < 10 && !screen.queryByText(/Você dominou/); i++) {
      const q = await questaoAtual(repo, 'u-ana', 'c-mat');
      await usuario.click(await screen.findByLabelText(q.alternativas[q.correta]));
      await usuario.click(screen.getByRole('button', { name: 'Responder' }));
      await screen.findByText('✔ Você acertou!');
      if (!screen.queryByText(/Você dominou/)) await usuario.click(screen.getByRole('button', { name: 'Próxima questão' }));
    }
    expect(screen.getByText(/Você dominou/)).toHaveTextContent('Decimais');
    expect(screen.getByText(/Tópico desbloqueado/)).toHaveTextContent('Porcentagem');
    await usuario.click(screen.getByRole('link', { name: '← Voltar à trilha' }));
    expect((await screen.findByText('Decimais')).closest('li')).toHaveTextContent('Dominado');
    expect(screen.getByText('Porcentagem').closest('li')).toHaveTextContent('Desbloqueado');
  });
});

describe('painel de desempenho do aluno', () => {
  it('os números batem com o histórico do seed (Ana em Matemática)', async () => {
    await renderizarApp('/aluno/cursos/c-mat/desempenho', 'u-ana');
    // Seed: 14 respostas, 11 acertos; XP = 4×10 + 3×20 + 1×30 (Frações) + 3×10 (Decimais) = 160.
    expect(await screen.findByTestId('taxa-acertos')).toHaveTextContent('79% (11 de 14)');
    expect(screen.getByTestId('xp')).toHaveTextContent('160');
    expect(screen.getByRole('progressbar', { name: 'Progresso do curso' })).toHaveAttribute('aria-valuenow', '33');
    expect(screen.getByRole('progressbar', { name: 'Domínio em Frações' })).toHaveAttribute('aria-valuenow', '95');
    expect(screen.getByRole('progressbar', { name: 'Domínio em Decimais' })).toHaveAttribute('aria-valuenow', '10');
  });
});
