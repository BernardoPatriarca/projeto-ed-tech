import { calcularEstado } from '../../adaptativo/motor';
import { useApp, useUsuario } from '../../app/contexto';
import { BarraProgresso, Vazio } from '../../componentes/comuns';
import { respostasDe, ultimaAtividade } from '../../desempenho/indicadores';
import { formatarData } from '../../dominio/datas';
import { sequenciaDias } from '../../gamificacao/gamificacao';

export function PainelResponsavel() {
  const { dados } = useApp();
  const usuario = useUsuario();
  // Somente alunos vinculados a este responsável.
  const alunos = dados.vinculosResponsavel
    .filter((v) => v.responsavelId === usuario.id)
    .map((v) => dados.usuarios.find((u) => u.id === v.alunoId))
    .filter((u) => u !== undefined);

  return (
    <>
      <h1>Acompanhamento dos alunos</h1>
      {alunos.length === 0 && <Vazio>Nenhum aluno vinculado a você.</Vazio>}
      {alunos.map((aluno) => {
        const matriculas = dados.matriculas.filter((m) => m.alunoId === aluno.id);
        return (
          <section key={aluno.id} className="cartao" aria-label={`Aluno ${aluno.nome}`}>
            <h2>{aluno.nome}</h2>
            {matriculas.length === 0 ? (
              <Vazio>Sem matrículas.</Vazio>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th scope="col">Curso</th>
                    <th scope="col">Progresso</th>
                    <th scope="col">Sequência</th>
                    <th scope="col">Última atividade</th>
                  </tr>
                </thead>
                <tbody>
                  {matriculas.map((m) => {
                    const curso = dados.cursos.find((c) => c.id === m.cursoId);
                    if (!curso) return null;
                    const respostas = respostasDe(dados, aluno.id, curso.id);
                    const ultima = ultimaAtividade(respostas);
                    const seq = sequenciaDias(respostas, curso.id, dados.dataVirtual);
                    return (
                      <tr key={m.id}>
                        <td>{curso.titulo}</td>
                        <td>
                          <BarraProgresso valor={calcularEstado(curso, respostas).progresso} rotulo={`Progresso em ${curso.titulo}`} />
                        </td>
                        <td>
                          {seq} {seq === 1 ? 'dia' : 'dias'}
                        </td>
                        <td>{ultima ? formatarData(ultima) : 'Sem atividade'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        );
      })}
    </>
  );
}
