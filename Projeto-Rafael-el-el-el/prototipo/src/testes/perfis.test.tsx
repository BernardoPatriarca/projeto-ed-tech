import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizarApp } from './renderizar';

describe('perfis-acesso', () => {
  it('Aluno acessando /professor é redirecionado para /aluno', async () => {
    const { rotaAtual } = await renderizarApp('/professor', 'u-ana');
    await waitFor(() => expect(rotaAtual()).toBe('/aluno'));
    expect(screen.getByRole('link', { name: 'Catálogo' })).toBeInTheDocument();
  });

  it('sem sessão, áreas restritas levam à tela de entrada', async () => {
    const { rotaAtual } = await renderizarApp('/admin/usuarios');
    await waitFor(() => expect(rotaAtual()).toBe('/'));
    expect(screen.getByRole('button', { name: 'Entrar como Ana Souza' })).toBeInTheDocument();
  });

  it('entrar como usuário de demonstração abre a área do perfil, e Sair volta à entrada', async () => {
    const { usuario, rotaAtual } = await renderizarApp('/');
    await usuario.click(screen.getByRole('button', { name: 'Entrar como Marcos Silva' }));
    await waitFor(() => expect(rotaAtual()).toBe('/professor'));
    await usuario.click(screen.getByRole('button', { name: 'Sair' }));
    await waitFor(() => expect(rotaAtual()).toBe('/'));
    await usuario.click(screen.getByRole('button', { name: 'Entrar como Helena Souza' }));
    await waitFor(() => expect(rotaAtual()).toBe('/responsavel'));
  });

  it('a tela de entrada não lista usuários inativos', async () => {
    await renderizarApp('/');
    expect(screen.queryByRole('button', { name: /Paulo Antunes/ })).not.toBeInTheDocument();
  });

  it('Administrador desativa um Professor: ele some da entrada e fica inativo na lista', async () => {
    const { usuario } = await renderizarApp('/admin/usuarios', 'u-renata');
    await usuario.click(await screen.findByRole('button', { name: 'Desativar Marcos Silva' }));
    const linha = (await screen.findByRole('button', { name: 'Reativar Marcos Silva' })).closest('tr')!;
    expect(within(linha).getByText('Inativo')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Sair' }));
    await screen.findByRole('button', { name: 'Entrar como Ana Souza' });
    expect(screen.queryByRole('button', { name: 'Entrar como Marcos Silva' })).not.toBeInTheDocument();
  });

  it('Administrador cria e edita usuário', async () => {
    const { usuario } = await renderizarApp('/admin/usuarios', 'u-renata');
    await usuario.type(await screen.findByLabelText('Nome'), 'Diego Melo');
    await usuario.type(screen.getByLabelText('E-mail'), 'diego@exemplo.com');
    await usuario.click(screen.getByRole('button', { name: 'Criar usuário' }));
    const linha = (await screen.findByText('Diego Melo')).closest('tr')!;
    await usuario.click(within(linha).getByRole('button', { name: 'Editar' }));
    await usuario.clear(screen.getByLabelText('Nome'));
    await usuario.type(screen.getByLabelText('Nome'), 'Diego M. Melo');
    await usuario.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(await screen.findByText('Diego M. Melo')).toBeInTheDocument();
  });

  it('Responsável vinculado apenas a Ana vê somente os dados de Ana', async () => {
    await renderizarApp('/responsavel', 'u-helena');
    expect(await screen.findByRole('region', { name: 'Aluno Ana Souza' })).toBeInTheDocument();
    expect(screen.queryByText('Bruno Lima')).not.toBeInTheDocument();
    expect(screen.queryByText('Carla Dias')).not.toBeInTheDocument();
  });

  it('vínculo criado pelo Administrador passa a aparecer para o Responsável', async () => {
    const { usuario } = await renderizarApp('/admin/vinculos', 'u-renata');
    const grupo = (await screen.findByText('Helena Souza', { selector: 'legend' })).closest('fieldset')!;
    await usuario.click(within(grupo).getByLabelText('Bruno Lima'));
    await usuario.click(screen.getByRole('button', { name: 'Sair' }));
    await usuario.click(await screen.findByRole('button', { name: 'Entrar como Helena Souza' }));
    expect(await screen.findByRole('region', { name: 'Aluno Bruno Lima' })).toBeInTheDocument();
  });
});
