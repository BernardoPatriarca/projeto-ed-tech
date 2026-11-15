import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useApp, useUsuario } from '../app/contexto';
import { formatarData } from '../dominio/datas';
import { NOME_PERFIL, type Perfil } from '../dominio/tipos';

const MENU: Record<Perfil, { para: string; rotulo: string; fim?: boolean }[]> = {
  aluno: [
    { para: '/aluno', rotulo: 'Meus cursos', fim: true },
    { para: '/aluno/catalogo', rotulo: 'Catálogo' },
  ],
  professor: [
    { para: '/professor', rotulo: 'Meus cursos', fim: true },
    { para: '/professor/cursos/novo', rotulo: 'Novo curso' },
  ],
  admin: [
    { para: '/admin', rotulo: 'Visão geral', fim: true },
    { para: '/admin/usuarios', rotulo: 'Usuários' },
    { para: '/admin/vinculos', rotulo: 'Vínculos' },
    { para: '/admin/cursos', rotulo: 'Cursos' },
  ],
  responsavel: [{ para: '/responsavel', rotulo: 'Painel', fim: true }],
};

export function Layout() {
  const usuario = useUsuario();
  const { dados, executar } = useApp();
  const navegar = useNavigate();

  const sair = async () => {
    await executar((r) => r.sair());
    navegar('/', { replace: true });
  };
  const restaurar = async () => {
    await executar((r) => r.restaurarDemonstracao());
    navegar('/', { replace: true });
  };

  return (
    <div className="app">
      <header className="topo">
        <div className="marca">Trilha Adaptativa</div>
        <nav aria-label="Menu principal">
          {MENU[usuario.perfil].map((item) => (
            <NavLink key={item.para} to={item.para} end={item.fim}>
              {item.rotulo}
            </NavLink>
          ))}
        </nav>
        <div className="usuario">
          <span>
            {usuario.nome} <small className="selo">{NOME_PERFIL[usuario.perfil]}</small>
          </span>
          <button onClick={sair}>Sair</button>
        </div>
      </header>
      <div className="barra-demo" role="region" aria-label="Controles da demonstração">
        <span>
          Data simulada: <strong>{formatarData(dados.dataVirtual)}</strong>
        </span>
        <button className="secundario" onClick={() => executar((r) => r.simularProximoDia())}>
          Simular próximo dia
        </button>
        <button className="secundario" onClick={restaurar}>
          Restaurar dados de demonstração
        </button>
      </div>
      <main className="conteudo">
        <Outlet />
      </main>
    </div>
  );
}
