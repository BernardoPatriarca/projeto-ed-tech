import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Dados, Usuario } from '../dominio/tipos';
import type { Repositorio } from '../dados/repositorio';

interface ValorApp {
  repo: Repositorio;
  dados: Dados;
  usuario: Usuario | null;
  /** Executa uma operação no repositório e recarrega dados e sessão. */
  executar: <T>(op: (repo: Repositorio) => Promise<T>) => Promise<T>;
}

const ContextoApp = createContext<ValorApp | null>(null);

export function ProvedorApp({ repo, children }: { repo: Repositorio; children: ReactNode }) {
  const [estado, setEstado] = useState<{ dados: Dados; usuario: Usuario | null } | null>(null);

  const recarregar = useCallback(async () => {
    const [dados, usuario] = await Promise.all([repo.obterDados(), repo.obterSessao()]);
    setEstado({ dados, usuario });
  }, [repo]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const executar = useCallback(
    async <T,>(op: (r: Repositorio) => Promise<T>): Promise<T> => {
      const resultado = await op(repo);
      await recarregar();
      return resultado;
    },
    [repo, recarregar],
  );

  const valor = useMemo(() => (estado ? { repo, ...estado, executar } : null), [repo, estado, executar]);

  if (!valor) return <p className="carregando">Carregando…</p>;
  return <ContextoApp.Provider value={valor}>{children}</ContextoApp.Provider>;
}

export function useApp(): ValorApp {
  const valor = useContext(ContextoApp);
  if (!valor) throw new Error('useApp fora do ProvedorApp');
  return valor;
}

/** Usuário atual; só deve ser usado dentro de rotas protegidas. */
export function useUsuario(): Usuario {
  const { usuario } = useApp();
  if (!usuario) throw new Error('Nenhum usuário na sessão');
  return usuario;
}
