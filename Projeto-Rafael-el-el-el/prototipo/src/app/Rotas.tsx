import { Navigate, Route, Routes } from 'react-router-dom';
import type { Perfil } from '../dominio/tipos';
import { CursosAdmin, Usuarios, VisaoGeral, Vinculos } from '../telas/admin/Admin';
import { Catalogo } from '../telas/aluno/Catalogo';
import { Desempenho } from '../telas/aluno/Desempenho';
import { DetalheCurso } from '../telas/aluno/DetalheCurso';
import { Materiais } from '../telas/aluno/Materiais';
import { MeusCursos } from '../telas/aluno/MeusCursos';
import { Sessao } from '../telas/aluno/Sessao';
import { Trilha } from '../telas/aluno/Trilha';
import { Entrada } from '../telas/Entrada';
import { Layout } from '../telas/Layout';
import { CursosProfessor } from '../telas/professor/CursosProfessor';
import { EditorCurso } from '../telas/professor/EditorCurso';
import { DetalheAluno, Turma } from '../telas/professor/Turma';
import { PainelResponsavel } from '../telas/responsavel/PainelResponsavel';
import { RotaProtegida } from './RotaProtegida';

function Area({ perfil, children }: { perfil: Perfil; children: React.ReactNode }) {
  return (
    <Route element={<RotaProtegida perfil={perfil} />}>
      <Route element={<Layout />}>{children}</Route>
    </Route>
  );
}

export function Rotas() {
  return (
    <Routes>
      <Route path="/" element={<Entrada />} />
      {Area({
        perfil: 'aluno',
        children: (
          <>
            <Route path="/aluno" element={<MeusCursos />} />
            <Route path="/aluno/catalogo" element={<Catalogo />} />
            <Route path="/aluno/cursos/:cursoId" element={<DetalheCurso />} />
            <Route path="/aluno/cursos/:cursoId/trilha" element={<Trilha />} />
            <Route path="/aluno/cursos/:cursoId/sessao" element={<Sessao />} />
            <Route path="/aluno/cursos/:cursoId/desempenho" element={<Desempenho />} />
            <Route path="/aluno/cursos/:cursoId/topicos/:topicoId" element={<Materiais />} />
            <Route path="/aluno/*" element={<Navigate to="/aluno" replace />} />
          </>
        ),
      })}
      {Area({
        perfil: 'professor',
        children: (
          <>
            <Route path="/professor" element={<CursosProfessor />} />
            <Route path="/professor/cursos/novo" element={<EditorCurso />} />
            <Route path="/professor/cursos/:cursoId" element={<EditorCurso />} />
            <Route path="/professor/cursos/:cursoId/turma" element={<Turma />} />
            <Route path="/professor/cursos/:cursoId/turma/:alunoId" element={<DetalheAluno />} />
            <Route path="/professor/*" element={<Navigate to="/professor" replace />} />
          </>
        ),
      })}
      {Area({
        perfil: 'admin',
        children: (
          <>
            <Route path="/admin" element={<VisaoGeral />} />
            <Route path="/admin/usuarios" element={<Usuarios />} />
            <Route path="/admin/vinculos" element={<Vinculos />} />
            <Route path="/admin/cursos" element={<CursosAdmin />} />
            <Route path="/admin/cursos/:cursoId" element={<EditorCurso />} />
            <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
          </>
        ),
      })}
      {Area({
        perfil: 'responsavel',
        children: (
          <>
            <Route path="/responsavel" element={<PainelResponsavel />} />
            <Route path="/responsavel/*" element={<Navigate to="/responsavel" replace />} />
          </>
        ),
      })}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
