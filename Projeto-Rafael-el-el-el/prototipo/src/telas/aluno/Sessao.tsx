import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { calcularEstado, deveSugerirRevisao, proximaQuestao, type ProximaAtividade } from '../../adaptativo/motor';
import { useApp, useUsuario } from '../../app/contexto';
import { EtiquetaDificuldade } from '../../componentes/comuns';
import type { Resposta } from '../../dominio/tipos';
import { conquistasCurso, novasConquistas, xpDaResposta, type ConquistaObtida } from '../../gamificacao/gamificacao';
import { useTrilha } from './useTrilha';

interface Feedback {
  resposta: Resposta;
  dominioAntes: number;
  dominioDepois: number;
  xp: number;
  conquistas: ConquistaObtida[];
  dominouTopico: boolean;
  desbloqueado?: string;
  concluiu: boolean;
  sugerirRevisao: boolean;
}

export function Sessao() {
  const { cursoId } = useParams();
  const { dados, executar } = useApp();
  const usuario = useUsuario();
  const trilha = useTrilha(cursoId);

  // A atividade atual fica fixa até o aluno pedir a próxima (os dados mudam ao responder).
  const [atividade, setAtual] = useState<ProximaAtividade | null>(() =>
    trilha ? proximaQuestao(trilha.estado, dados.questoes, trilha.respostas) : null,
  );
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  if (!trilha) return <Navigate to={`/aluno/cursos/${cursoId}`} replace />;
  const { curso, respostas, estado } = trilha;

  const proxima = () => {
    setAtual(proximaQuestao(estado, dados.questoes, respostas));
    setSelecionada(null);
    setFeedback(null);
  };

  const responder = async () => {
    if (!atividade || selecionada === null) return;
    const topicoId = atividade.topicoId;
    const antes = estado.topicos.find((t) => t.topicoId === topicoId)!;
    const conquistasAntes = conquistasCurso(curso, respostas);

    const resposta = await executar((r) =>
      r.registrarResposta({ alunoId: usuario.id, cursoId: curso.id, questaoId: atividade.questao.id, alternativa: selecionada }),
    );

    const respostasDepois = [...respostas, resposta];
    const estadoDepois = calcularEstado(curso, respostasDepois);
    const depois = estadoDepois.topicos.find((t) => t.topicoId === topicoId)!;
    const indice = estadoDepois.topicos.indexOf(depois);
    const seguinte = estadoDepois.topicos[indice + 1];
    const dominouTopico = depois.dominado && !antes.dominado;

    setFeedback({
      resposta,
      dominioAntes: antes.dominio,
      dominioDepois: depois.dominio,
      xp: xpDaResposta(resposta),
      conquistas: novasConquistas(conquistasAntes, conquistasCurso(curso, respostasDepois)),
      dominouTopico,
      desbloqueado: dominouTopico && seguinte?.desbloqueado ? seguinte.titulo : undefined,
      concluiu: estadoDepois.concluido && !estado.concluido,
      sugerirRevisao: deveSugerirRevisao(respostasDepois, topicoId),
    });
  };

  const voltar = (
    <p>
      <Link to={`/aluno/cursos/${curso.id}/trilha`}>← Voltar à trilha</Link>
    </p>
  );

  if (!atividade) {
    return (
      <>
        {voltar}
        <h1>{curso.titulo}</h1>
        <p className="vazio">
          {estado.concluido ? 'Você concluiu este curso! 🎉' : 'Não há questões disponíveis no momento.'}
        </p>
      </>
    );
  }

  const { questao } = atividade;
  const topico = curso.topicos.find((t) => t.id === atividade.topicoId)!;
  const variacao = feedback ? feedback.dominioDepois - feedback.dominioAntes : 0;

  return (
    <>
      {voltar}
      <h1>{curso.titulo}</h1>
      <article className="cartao questao" aria-labelledby="enunciado">
        <p className="meta">
          Tópico: <strong>{topico.titulo}</strong> · <EtiquetaDificuldade dificuldade={questao.dificuldade} />
        </p>
        <h2 id="enunciado">{questao.enunciado}</h2>
        <fieldset disabled={Boolean(feedback)}>
          <legend className="sr-only">Alternativas</legend>
          {questao.alternativas.map((alt, i) => {
            const classe = feedback ? (i === questao.correta ? 'correta' : i === selecionada ? 'errada' : '') : '';
            return (
              <label key={i} className={`alternativa ${classe}`}>
                <input
                  type="radio"
                  name="alternativa"
                  checked={selecionada === i}
                  onChange={() => setSelecionada(i)}
                />
                {alt}
              </label>
            );
          })}
        </fieldset>
        {!feedback && (
          <button onClick={responder} disabled={selecionada === null}>
            Responder
          </button>
        )}
      </article>

      {feedback && (
        <section className={`feedback ${feedback.resposta.acertou ? 'acerto' : 'erro'}`} aria-live="polite">
          <h2>{feedback.resposta.acertou ? '✔ Você acertou!' : '✘ Você errou.'}</h2>
          {!feedback.resposta.acertou && (
            <p>
              Alternativa correta: <strong>{questao.alternativas[questao.correta]}</strong>
            </p>
          )}
          <p>
            <strong>Explicação:</strong> {questao.explicacao}
          </p>
          <p>
            Domínio em {topico.titulo}: {feedback.dominioAntes} → <strong>{feedback.dominioDepois}</strong> (
            {variacao >= 0 ? '+' : ''}
            {variacao})
            {feedback.xp > 0 && <> · +{feedback.xp} XP</>}
          </p>
          {feedback.dominouTopico && (
            <p className="destaque">
              🎯 Você dominou <strong>{topico.titulo}</strong>!
              {feedback.desbloqueado && (
                <>
                  {' '}
                  Tópico desbloqueado: <strong>{feedback.desbloqueado}</strong>.
                </>
              )}
            </p>
          )}
          {feedback.conquistas.map((c) => (
            <p key={c.id} className="destaque">
              🏆 Conquista desbloqueada: <strong>{c.nome}</strong>
            </p>
          ))}
          {feedback.concluiu && <p className="destaque">🎉 Curso concluído! Progresso: 100%.</p>}
          {feedback.sugerirRevisao && (
            <div className="revisao" role="note">
              <p>
                Você errou duas questões seguidas em <strong>{topico.titulo}</strong>. Que tal revisar os materiais antes
                de continuar?
              </p>
              <Link className="botao secundario" to={`/aluno/cursos/${curso.id}/topicos/${topico.id}`}>
                Revisar materiais de {topico.titulo}
              </Link>
            </div>
          )}
          <div className="acoes">
            {feedback.concluiu ? (
              <Link className="botao" to={`/aluno/cursos/${curso.id}/trilha`}>
                Ver trilha
              </Link>
            ) : (
              <button onClick={proxima}>{feedback.sugerirRevisao ? 'Continuar mesmo assim' : 'Próxima questão'}</button>
            )}
          </div>
        </section>
      )}
    </>
  );
}
