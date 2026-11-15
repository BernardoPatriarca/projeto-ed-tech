import { Link } from 'react-router-dom';
import { useApp, useUsuario } from '../../app/contexto';
import { Vazio } from '../../componentes/comuns';

export function CursosProfessor() {
  const { dados } = useApp();
  const usuario = useUsuario();
  const ids = new Set(dados.vinculosProfessor.filter((v) => v.professorId === usuario.id).map((v) => v.cursoId));
  const cursos = dados.cursos.filter((c) => ids.has(c.id));

  return (
    <>
      <h1>Meus cursos</h1>
      <p>
        <Link className="botao" to="/professor/cursos/novo">
          + Novo curso
        </Link>
      </p>
      {cursos.length === 0 ? (
        <Vazio>Você ainda não está vinculado a nenhum curso.</Vazio>
      ) : (
        <table>
          <thead>
            <tr>
              <th scope="col">Curso</th>
              <th scope="col">Status</th>
              <th scope="col">Tópicos</th>
              <th scope="col">Matriculados</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            {cursos.map((c) => (
              <tr key={c.id}>
                <td>{c.titulo}</td>
                <td>
                  <span className={`selo ${c.status === 'publicado' ? 'ok' : ''}`}>{c.status}</span>
                </td>
                <td>{c.topicos.length}</td>
                <td>{dados.matriculas.filter((m) => m.cursoId === c.id).length}</td>
                <td className="acoes-tabela">
                  <Link to={`/professor/cursos/${c.id}`}>Editar</Link>
                  <Link to={`/professor/cursos/${c.id}/turma`}>Turma</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
