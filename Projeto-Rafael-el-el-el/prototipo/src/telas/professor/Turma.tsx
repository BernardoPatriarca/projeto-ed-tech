import { Link, useParams } from 'react-router-dom';
import { calcularEstado, ordenarRespostas } from '../../adaptativo/motor';
import { useApp, useUsuario } from '../../app/contexto';
import { BarraProgresso, EtiquetaDificuldade, Vazio } from '../../componentes/comuns';
import { podeEditarCurso } from '../../conteudo/regras';
import { dominioMedioPorTopico, precisaDeAtencao, respostasDe, taxaAcertos } from '../../desempenho/indicadores';
import { formatarData } from '../../dominio/datas';

function useCursoDoProfessor() {
  const { cursoId } = useParams();
  const { dados } = useApp();
  const usuario = useUsuario();
  const curso = dados.cursos.find((c) => c.id === cursoId);
  if (!curso || !podeEditarCurso(usuario, curso.id, dados.vinculosProfessor)) return null;
  return curso;
}

export function Turma() {
  const { dados } = useApp();
  const curso = useCursoDoProfessor();
  if (!curso) return <Vazio>Curso não encontrado ou não vinculado a você.</Vazio>;

  const alunos = dados.matriculas
    .filter((m) => m.cursoId === curso.id)
    .map((m) => dados.usuarios.find((u) => u.id === m.alunoId)!)
    .filter(Boolean)
    .map((aluno) => {
      const respostas = respostasDe(dados, aluno.id, curso.id);
      return {
        aluno,
        respostas,
        progresso: calcularEstado(curso, respostas).progresso,
        taxa: taxaAcertos(respostas),
        atencao: precisaDeAtencao(respostas),
      };
    });
  const medias = dominioMedioPorTopico(curso, alunos.map((a) => a.respostas));

  return (
    <>
      <p>
        <Link to="/professor">← Meus cursos</Link>
      </p>
      <h1>Turma — {curso.titulo}</h1>
      <h2>Alunos matriculados</h2>
      {alunos.length === 0 ? (
        <Vazio>Nenhum aluno matriculado.</Vazio>
      ) : (
        <table>
          <thead>
            <tr>
              <th scope="col">Aluno</th>
              <th scope="col">Progresso</th>
              <th scope="col">Taxa de acertos</th>
              <th scope="col">Situação</th>
            </tr>
          </thead>
          <tbody>
            {alunos.map(({ aluno, progresso, taxa, atencao }) => (
              <tr key={aluno.id} className={atencao ? 'linha-atencao' : ''}>
                <td>
                  <Link to={`/professor/cursos/${curso.id}/turma/${aluno.id}`}>{aluno.nome}</Link>
                </td>
                <td>
                  <BarraProgresso valor={progresso} rotulo={`Progresso de ${aluno.nome}`} />
                </td>
                <td>
                  {taxa.taxa}% <small>({taxa.acertos}/{taxa.total})</small>
                </td>
                <td>{atencao ? <span className="selo alerta-selo">⚠ Precisa de atenção</span> : 'Regular'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="meta">“Precisa de atenção”: menos de 50% de acertos nas últimas 10 respostas do curso.</p>
      <h2>Domínio médio da turma por tópico</h2>
      <table>
        <tbody>
          {medias.map((m) => (
            <tr key={m.topicoId}>
              <th scope="row">{m.titulo}</th>
              <td>
                <BarraProgresso valor={m.media} rotulo={`Domínio médio em ${m.titulo}`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export function DetalheAluno() {
  const { alunoId } = useParams();
  const { dados } = useApp();
  const curso = useCursoDoProfessor();
  const aluno = dados.usuarios.find((u) => u.id === alunoId);
  const matriculado = dados.matriculas.some((m) => m.alunoId === alunoId && m.cursoId === curso?.id);
  if (!curso || !aluno || !matriculado) return <Vazio>Aluno não encontrado neste curso.</Vazio>;

  const respostas = respostasDe(dados, aluno.id, curso.id);
  const estado = calcularEstado(curso, respostas);
  const recentes = ordenarRespostas(respostas).slice(-10).reverse();

  return (
    <>
      <p>
        <Link to={`/professor/cursos/${curso.id}/turma`}>← Turma</Link>
      </p>
      <h1>
        {aluno.nome} — {curso.titulo}
      </h1>
      <h2>Domínio por tópico</h2>
      <table>
        <tbody>
          {estado.topicos.map((t) => (
            <tr key={t.topicoId}>
              <th scope="row">{t.titulo}</th>
              <td>{t.dominado ? 'Dominado' : t.desbloqueado ? 'Em andamento' : 'Bloqueado'}</td>
              <td>
                <BarraProgresso valor={t.dominio} rotulo={`Domínio em ${t.titulo}`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Respostas recentes</h2>
      {recentes.length === 0 ? (
        <Vazio>Sem respostas ainda.</Vazio>
      ) : (
        <table>
          <thead>
            <tr>
              <th scope="col">Data</th>
              <th scope="col">Tópico</th>
              <th scope="col">Questão</th>
              <th scope="col">Dificuldade</th>
              <th scope="col">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {recentes.map((r) => (
              <tr key={r.id}>
                <td>{formatarData(r.data)}</td>
                <td>{curso.topicos.find((t) => t.id === r.topicoId)?.titulo ?? '—'}</td>
                <td>{dados.questoes.find((q) => q.id === r.questaoId)?.enunciado ?? '(questão removida)'}</td>
                <td>
                  <EtiquetaDificuldade dificuldade={r.dificuldade} />
                </td>
                <td>{r.acertou ? '✔ Acerto' : '✘ Erro'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
