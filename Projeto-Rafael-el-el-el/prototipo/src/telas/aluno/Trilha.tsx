import { Link, Navigate, useParams } from 'react-router-dom';
import { useApp } from '../../app/contexto';
import { BarraProgresso } from '../../componentes/comuns';
import { formatarData } from '../../dominio/datas';
import { CONQUISTAS, conquistasCurso, sequenciaDias, xpCurso } from '../../gamificacao/gamificacao';
import { useTrilha } from './useTrilha';

export function Trilha() {
  const { cursoId } = useParams();
  const { dados } = useApp();
  const trilha = useTrilha(cursoId);
  if (!trilha) return <Navigate to={`/aluno/cursos/${cursoId}`} replace />;
  const { curso, respostas, estado } = trilha;

  const xp = xpCurso(respostas, curso.id);
  const sequencia = sequenciaDias(respostas, curso.id, dados.dataVirtual);
  const obtidas = conquistasCurso(curso, respostas);

  return (
    <>
      <p>
        <Link to="/aluno">← Meus cursos</Link>
      </p>
      <h1>{curso.titulo}</h1>

      <section className="indicadores" aria-label="Indicadores do curso">
        <div className="indicador">
          <span className="rotulo">Progresso</span>
          <BarraProgresso valor={estado.progresso} rotulo="Progresso do curso" />
          {estado.concluido && <span className="selo ok">Curso concluído</span>}
        </div>
        <div className="indicador">
          <span className="rotulo">XP</span>
          <strong className="numero">{xp}</strong>
        </div>
        <div className="indicador">
          <span className="rotulo">Sequência</span>
          <strong className="numero">
            {sequencia} {sequencia === 1 ? 'dia' : 'dias'}
          </strong>
        </div>
      </section>

      <div className="acoes">
        {estado.concluido ? (
          <span>Parabéns! Você dominou todos os tópicos.</span>
        ) : (
          <Link className="botao" to={`/aluno/cursos/${curso.id}/sessao`}>
            Próxima atividade
          </Link>
        )}
        <Link className="botao secundario" to={`/aluno/cursos/${curso.id}/desempenho`}>
          Ver desempenho
        </Link>
      </div>

      <h2>Trilha de tópicos</h2>
      <ol className="trilha lista-limpa">
        {estado.topicos.map((t) => {
          const situacao = t.dominado ? 'dominado' : t.desbloqueado ? 'desbloqueado' : 'bloqueado';
          return (
            <li key={t.topicoId} className={`topico ${situacao}`}>
              <div>
                <strong>{t.titulo}</strong>{' '}
                <span className={`selo ${situacao}`}>
                  {t.dominado ? '✓ Dominado' : t.desbloqueado ? 'Desbloqueado' : '🔒 Bloqueado'}
                </span>
              </div>
              {t.desbloqueado && (
                <>
                  <BarraProgresso valor={t.dominio} rotulo={`Domínio em ${t.titulo}`} />
                  <Link to={`/aluno/cursos/${curso.id}/topicos/${t.topicoId}`}>Materiais</Link>
                </>
              )}
            </li>
          );
        })}
      </ol>

      <h2>Conquistas</h2>
      <ul className="conquistas lista-limpa">
        {CONQUISTAS.map((c) => {
          const obtida = obtidas.find((o) => o.id === c.id);
          return (
            <li key={c.id} className={obtida ? 'obtida' : 'pendente'}>
              <span aria-hidden>{obtida ? '🏆' : '○'}</span> <strong>{c.nome}</strong>
              <br />
              <small>{obtida ? `Conquistada em ${formatarData(obtida.data)}` : c.descricao}</small>
            </li>
          );
        })}
      </ul>
    </>
  );
}
