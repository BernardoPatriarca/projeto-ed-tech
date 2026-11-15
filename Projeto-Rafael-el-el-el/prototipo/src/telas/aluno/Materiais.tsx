import { Link, Navigate, useParams } from 'react-router-dom';
import { Vazio } from '../../componentes/comuns';
import { useTrilha } from './useTrilha';

const NOME_TIPO = { texto: 'Texto', video: 'Vídeo', arquivo: 'Arquivo' } as const;

export function Materiais() {
  const { cursoId, topicoId } = useParams();
  const trilha = useTrilha(cursoId);
  if (!trilha) return <Navigate to={`/aluno/cursos/${cursoId}`} replace />;
  const topico = trilha.curso.topicos.find((t) => t.id === topicoId);
  const estado = trilha.estado.topicos.find((t) => t.topicoId === topicoId);

  return (
    <>
      <p>
        <Link to={`/aluno/cursos/${cursoId}/trilha`}>← Voltar à trilha</Link>
      </p>
      {!topico || !estado?.desbloqueado ? (
        <Vazio>Este tópico ainda está bloqueado.</Vazio>
      ) : (
        <>
          <h1>Materiais: {topico.titulo}</h1>
          {topico.materiais.length === 0 ? (
            <Vazio>Este tópico ainda não tem materiais.</Vazio>
          ) : (
            <ul className="lista-limpa">
              {topico.materiais.map((m) => (
                <li key={m.id} className="cartao">
                  <span className="selo">{NOME_TIPO[m.tipo]}</span> <strong>{m.titulo}</strong>
                  {m.tipo === 'texto' ? (
                    <p>{m.conteudo}</p>
                  ) : (
                    <p>
                      <a href={m.conteudo} target="_blank" rel="noreferrer">
                        Abrir {NOME_TIPO[m.tipo].toLowerCase()} ↗
                      </a>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!trilha.estado.concluido && (
            <Link className="botao" to={`/aluno/cursos/${cursoId}/sessao`}>
              Continuar estudando
            </Link>
          )}
        </>
      )}
    </>
  );
}
