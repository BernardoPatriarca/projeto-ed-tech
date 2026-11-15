import { Navigate, Outlet } from 'react-router-dom';
import type { Perfil } from '../dominio/tipos';
import { useApp } from './contexto';

export const AREA_DO_PERFIL: Record<Perfil, string> = {
  aluno: '/aluno',
  professor: '/professor',
  admin: '/admin',
  responsavel: '/responsavel',
};

/** Sem sessão → tela de entrada; perfil diferente → área inicial do próprio perfil. */
export function RotaProtegida({ perfil }: { perfil: Perfil }) {
  const { usuario } = useApp();
  if (!usuario) return <Navigate to="/" replace />;
  if (usuario.perfil !== perfil) return <Navigate to={AREA_DO_PERFIL[usuario.perfil]} replace />;
  return <Outlet />;
}
