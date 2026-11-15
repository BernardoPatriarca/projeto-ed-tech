import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { ProvedorApp } from '../app/contexto';
import { Rotas } from '../app/Rotas';
import { Repositorio } from '../dados/repositorio';

function Sonda() {
  return <output data-testid="rota">{useLocation().pathname}</output>;
}

/** Renderiza o app completo numa rota, opcionalmente com um usuário já na sessão. */
export async function renderizarApp(rota: string, usuarioId?: string, preparar?: (repo: Repositorio) => Promise<void>) {
  const repo = new Repositorio(localStorage);
  await repo.restaurarDemonstracao();
  if (preparar) await preparar(repo);
  if (usuarioId) await repo.entrar(usuarioId);
  const usuario = userEvent.setup();
  render(
    <ProvedorApp repo={repo}>
      <MemoryRouter initialEntries={[rota]}>
        <Rotas />
        <Sonda />
      </MemoryRouter>
    </ProvedorApp>,
  );
  await screen.findByTestId('rota');
  return { repo, usuario, rotaAtual: () => screen.getByTestId('rota').textContent };
}
