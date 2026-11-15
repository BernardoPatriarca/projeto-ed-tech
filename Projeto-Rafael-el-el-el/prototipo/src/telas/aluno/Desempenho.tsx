import { Link, Navigate, useParams } from 'react-router-dom';
import { useApp } from '../../app/contexto';
import { BarraProgresso } from '../../componentes/comuns';
import { taxaAcertos } from '../../desempenho/indicadores';
import { sequenciaDias, xpCurso } from '../../gamificacao/gamificacao';
import { useTrilha } from './useTrilha';

export function Desempenho() {
  const { cursoId } = useParams();
  const { dados } = useApp();
  const trilha = useTrilha(cursoId);
  if (!trilha) return <Navigate to={`/aluno/cursos/${cursoId}`} replace />;
  const { curso, respostas, estado } = trilha;
  const taxa = taxaAcertos(respostas);

  return (
    <>
      <p>
        <Link to={`/aluno/cursos/${curso.id}/trilha`}>← Voltar à trilha</Link>
      </p>
      <h1>Desempenho em {curso.titulo}</h1>
      <dl className="indicadores">
        <div className="indicador">
          <dt className="rotulo">Progresso</dt>
          <dd>
            <BarraProgresso valor={estado.progresso} rotulo="Progresso do curso" />
          </dd>
        </div>
        <div className="indicador">
          <dt className="rotulo">Taxa de acertos</dt>
          <dd className="numero" data-testid="taxa-acertos">
            {taxa.taxa}% <small>({taxa.acertos} de {taxa.total})</small>
          </dd>
        </div>
        <div className="indicador">
          <dt className="rotulo">XP</dt>
          <dd className="numero" data-testid="xp">
            {xpCurso(respostas, curso.id)}
          </dd>
        </div>
        <div className="indicador">
          <dt className="rotulo">Sequência</dt>
          <dd className="numero">{sequenciaDias(respostas, curso.id, dados.dataVirtual)} dias</dd>
        </div>
      </dl>
      <h2>Domínio por tópico</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Tópico</th>
            <th scope="col">Situação</th>
            <th scope="col">Domínio</th>
          </tr>
        </thead>
        <tbody>
          {estado.topicos.map((t) => (
            <tr key={t.topicoId}>
              <td>{t.titulo}</td>
              <td>{t.dominado ? 'Dominado' : t.desbloqueado ? 'Em andamento' : 'Bloqueado'}</td>
              <td>
                <BarraProgresso valor={t.dominio} rotulo={`Domínio em ${t.titulo}`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
