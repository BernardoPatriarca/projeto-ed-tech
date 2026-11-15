import { Link } from 'react-router-dom';
import { calcularEstado } from '../../adaptativo/motor';
import { useApp, useUsuario } from '../../app/contexto';
import { BarraProgresso, Vazio } from '../../componentes/comuns';
import { respostasDe } from '../../desempenho/indicadores';

export function MeusCursos() {
  const { dados } = useApp();
  const usuario = useUsuario();
  const matriculas = dados.matriculas.filter((m) => m.alunoId === usuario.id);

  return (
    <>
      <h1>Meus cursos</h1>
      {matriculas.length === 0 ? (
        <Vazio>
          Você ainda não está matriculado em nenhum curso. <Link to="/aluno/catalogo">Explore o catálogo</Link>.
        </Vazio>
      ) : (
        <ul className="grade-cartoes lista-limpa">
          {matriculas.map((m) => {
            const curso = dados.cursos.find((c) => c.id === m.cursoId);
            if (!curso) return null;
            const estado = calcularEstado(curso, respostasDe(dados, usuario.id, curso.id));
            return (
              <li key={m.id} className="cartao">
                <h2>{curso.titulo}</h2>
                <BarraProgresso valor={estado.progresso} rotulo={`Progresso em ${curso.titulo}`} />
                {estado.concluido && <span className="selo ok">Concluído</span>}
                <p>
                  <Link className="botao" to={`/aluno/cursos/${curso.id}/trilha`}>
                    Abrir trilha
                  </Link>
                </p>
              </li>
            );
          })}
        </ul>
      )}
      <p>
        <Link to="/aluno/catalogo">Ver catálogo de cursos →</Link>
      </p>
    </>
  );
}
