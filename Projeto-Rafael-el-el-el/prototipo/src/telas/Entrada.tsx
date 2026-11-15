import { Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../app/contexto';
import { AREA_DO_PERFIL } from '../app/RotaProtegida';
import { NOME_PERFIL, PERFIS } from '../dominio/tipos';

export function Entrada() {
  const { dados, usuario, executar } = useApp();
  const navegar = useNavigate();

  if (usuario) return <Navigate to={AREA_DO_PERFIL[usuario.perfil]} replace />;

  const entrar = async (id: string) => {
    const u = await executar((r) => r.entrar(id));
    navegar(AREA_DO_PERFIL[u.perfil]);
  };

  const ativos = dados.usuarios.filter((u) => u.ativo);

  return (
    <main className="entrada">
      <h1>Trilha Adaptativa</h1>
      <p className="sub">
        Protótipo navegável com dados fictícios. Escolha um usuário de demonstração para entrar (sem senha).
      </p>
      <div className="grade-perfis">
        {PERFIS.map((perfil) => (
          <section key={perfil} className="cartao">
            <h2>{NOME_PERFIL[perfil]}</h2>
            <ul className="lista-limpa">
              {ativos
                .filter((u) => u.perfil === perfil)
                .map((u) => (
                  <li key={u.id}>
                    <button className="largo" onClick={() => entrar(u.id)}>
                      Entrar como {u.nome}
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
      <p>
        <button className="secundario" onClick={() => executar((r) => r.restaurarDemonstracao())}>
          Restaurar dados de demonstração
        </button>
      </p>
    </main>
  );
}
