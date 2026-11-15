import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp, useUsuario } from '../../app/contexto';
import { Vazio } from '../../componentes/comuns';

export function DetalheCurso() {
  const { cursoId } = useParams();
  const { dados, executar } = useApp();
  const usuario = useUsuario();
  const navegar = useNavigate();

  const curso = dados.cursos.find((c) => c.id === cursoId && c.status === 'publicado');
  if (!curso) return <Vazio>Curso não encontrado.</Vazio>;

  const matriculado = dados.matriculas.some((m) => m.alunoId === usuario.id && m.cursoId === curso.id);
  const professores = dados.vinculosProfessor
    .filter((v) => v.cursoId === curso.id)
    .map((v) => dados.usuarios.find((u) => u.id === v.professorId)?.nome)
    .filter(Boolean);

  const matricular = async () => {
    await executar((r) => r.matricular(usuario.id, curso.id));
    navegar(`/aluno/cursos/${curso.id}/trilha`);
  };

  return (
    <>
      <p>
        <Link to="/aluno/catalogo">← Catálogo</Link>
      </p>
      <h1>{curso.titulo}</h1>
      <p className="meta">
        {curso.area} · {curso.nivel} · Professor(a): {professores.join(', ') || 'a definir'}
      </p>
      <p>{curso.descricao}</p>
      <h2>Tópicos</h2>
      <ol>
        {curso.topicos.map((t) => (
          <li key={t.id}>{t.titulo}</li>
        ))}
      </ol>
      {matriculado ? (
        <Link className="botao" to={`/aluno/cursos/${curso.id}/trilha`}>
          Continuar
        </Link>
      ) : (
        <button onClick={matricular}>Matricular</button>
      )}
    </>
  );
}
