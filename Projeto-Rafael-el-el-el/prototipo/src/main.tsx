import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ProvedorApp } from './app/contexto';
import { Rotas } from './app/Rotas';
import { Repositorio } from './dados/repositorio';
import './estilos.css';

const repo = new Repositorio();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProvedorApp repo={repo}>
      <BrowserRouter>
        <Rotas />
      </BrowserRouter>
    </ProvedorApp>
  </StrictMode>,
);
