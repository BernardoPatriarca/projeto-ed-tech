import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp, useUsuario } from '../../app/contexto';
import { EtiquetaDificuldade, Vazio } from '../../componentes/comuns';
import {
  podeEditarCurso,
  validarCurso,
  validarQuestao,
  type DadosCursoForm,
  type VerificacaoPublicacao,
} from '../../conteudo/regras';
import { novoId } from '../../dados/repositorio';
import {
  DIFICULDADES,
  NIVEIS_CURSO,
  NOME_DIFICULDADE,
  type Curso,
  type Dificuldade,
  type NivelCurso,
  type TipoMaterial,
  type Topico,
} from '../../dominio/tipos';

/** Editor de curso usado pelo Professor (cursos vinculados) e pelo Administrador (todos). */
export function EditorCurso() {
  const { cursoId } = useParams();
  const { dados } = useApp();
  const usuario = useUsuario();
  const base = usuario.perfil === 'admin' ? '/admin/cursos' : '/professor/cursos';

  if (!cursoId) return <FormDadosCurso base={base} />;

  const curso = dados.cursos.find((c) => c.id === cursoId);
  if (!curso) return <Vazio>Curso não encontrado.</Vazio>;
  if (!podeEditarCurso(usuario, curso.id, dados.vinculosProfessor)) {
    return (
      <div role="alert" className="alerta">
        <h1>Edição não permitida</h1>
        <p>Você não está vinculado a este curso e por isso não pode editá-lo.</p>
        <Link to={usuario.perfil === 'admin' ? '/admin' : '/professor'}>← Voltar</Link>
      </div>
    );
  }
  return <EditorCursoExistente curso={curso} base={base} />;
}

function FormDadosCurso({ curso, base }: { curso?: Curso; base: string }) {
  const { executar } = useApp();
  const usuario = useUsuario();
  const navegar = useNavigate();
  const [form, setForm] = useState<DadosCursoForm & { descricaoCurta: string }>({
    titulo: curso?.titulo ?? '',
    descricaoCurta: curso?.descricaoCurta ?? '',
    descricao: curso?.descricao ?? '',
    area: curso?.area ?? '',
    nivel: curso?.nivel ?? 'Iniciante',
  });
  const [erros, setErros] = useState<ReturnType<typeof validarCurso>>({});
  const [salvo, setSalvo] = useState(false);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const encontrados = validarCurso(form);
    setErros(encontrados);
    setSalvo(false);
    if (Object.keys(encontrados).length > 0) return;
    const resultado = await executar((r) =>
      r.salvarCurso(
        {
          id: curso?.id,
          titulo: form.titulo.trim(),
          descricaoCurta: form.descricaoCurta.trim(),
          descricao: form.descricao.trim(),
          area: form.area.trim(),
          nivel: form.nivel as NivelCurso,
          topicos: curso?.topicos ?? [],
        },
        usuario.id,
      ),
    );
    if (!curso) navegar(`${base}/${resultado.id}`);
    else setSalvo(true);
  };

  const campo = (nome: keyof typeof form, rotulo: string, multilinha = false) => (
    <label>
      {rotulo}
      {multilinha ? (
        <textarea value={form[nome]} onChange={(e) => setForm({ ...form, [nome]: e.target.value })} />
      ) : (
        <input
          value={form[nome]}
          aria-invalid={Boolean(erros[nome as keyof DadosCursoForm])}
          onChange={(e) => setForm({ ...form, [nome]: e.target.value })}
        />
      )}
      {erros[nome as keyof DadosCursoForm] && <span className="erro-campo">{erros[nome as keyof DadosCursoForm]}</span>}
    </label>
  );

  return (
    <form className="formulario cartao" onSubmit={salvar} noValidate>
      {!curso && <h1>Novo curso</h1>}
      {curso && <h2>Dados do curso</h2>}
      {campo('titulo', 'Título *')}
      {campo('descricaoCurta', 'Descrição curta')}
      {campo('descricao', 'Descrição completa', true)}
      {campo('area', 'Área *')}
      <label>
        Nível
        <select value={form.nivel} onChange={(e) => setForm({ ...form, nivel: e.target.value })}>
          {NIVEIS_CURSO.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </label>
      <div className="acoes">
        <button type="submit">{curso ? 'Salvar dados' : 'Criar curso (rascunho)'}</button>
        {salvo && <span role="status">Dados salvos.</span>}
      </div>
    </form>
  );
}

function EditorCursoExistente({ curso, base }: { curso: Curso; base: string }) {
  const { dados, executar } = useApp();
  const [selecionado, setSelecionado] = useState<string | null>(curso.topicos[0]?.id ?? null);
  const [novoTopico, setNovoTopico] = useState('');
  const [publicacao, setPublicacao] = useState<VerificacaoPublicacao | null>(null);
  const [removendo, setRemovendo] = useState<string | null>(null);

  const salvarTopicos = (topicos: Topico[]) =>
    executar((r) => r.salvarCurso({ ...curso, topicos }));

  const mover = (i: number, delta: number) => {
    const topicos = [...curso.topicos];
    [topicos[i], topicos[i + delta]] = [topicos[i + delta], topicos[i]];
    return salvarTopicos(topicos);
  };

  const adicionarTopico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTopico.trim()) return;
    const topico: Topico = { id: novoId('t'), titulo: novoTopico.trim(), materiais: [] };
    await salvarTopicos([...curso.topicos, topico]);
    setNovoTopico('');
    setSelecionado(topico.id);
  };

  const renomear = (id: string, titulo: string) =>
    titulo.trim() && salvarTopicos(curso.topicos.map((t) => (t.id === id ? { ...t, titulo: titulo.trim() } : t)));

  const remover = async (id: string) => {
    await salvarTopicos(curso.topicos.filter((t) => t.id !== id));
    setRemovendo(null);
    if (selecionado === id) setSelecionado(null);
  };

  const publicar = async () => setPublicacao(await executar((r) => r.publicarCurso(curso.id)));

  const topico = curso.topicos.find((t) => t.id === selecionado);

  return (
    <>
      <p>
        <Link to={base === '/admin/cursos' ? '/admin/cursos' : '/professor'}>← Cursos</Link>
      </p>
      <h1>
        {curso.titulo}{' '}
        <span className={`selo ${curso.status === 'publicado' ? 'ok' : ''}`}>{curso.status}</span>
      </h1>

      <section className="cartao publicacao" aria-labelledby="titulo-publicacao">
        <h2 id="titulo-publicacao">Publicação</h2>
        {curso.status === 'publicado' ? (
          <p>Este curso está publicado e aparece no catálogo.</p>
        ) : (
          <>
            <p>Para publicar, cada tópico precisa de ao menos uma questão Fácil, uma Média e uma Difícil.</p>
            <button onClick={publicar}>Publicar curso</button>
          </>
        )}
        {publicacao?.ok && <p role="status">Curso publicado! Ele já aparece no catálogo.</p>}
        {publicacao && !publicacao.ok && (
          <div role="alert" className="alerta">
            <p>O curso não pode ser publicado ainda. Falta:</p>
            <ul>
              {publicacao.semTopicos && <li>adicionar ao menos um tópico</li>}
              {publicacao.faltantes.map((f) => (
                <li key={f.topicoId}>
                  <strong>{f.titulo}</strong>: questões de nível {f.niveis.map((n) => NOME_DIFICULDADE[n]).join(', ')}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <FormDadosCurso key={curso.id} curso={curso} base={base} />

      <section className="cartao" aria-labelledby="titulo-topicos">
        <h2 id="titulo-topicos">Tópicos (a ordem define o desbloqueio)</h2>
        {curso.topicos.length === 0 && <Vazio>Nenhum tópico ainda.</Vazio>}
        <ol className="lista-topicos">
          {curso.topicos.map((t, i) => (
            <li key={t.id} className={t.id === selecionado ? 'selecionado' : ''}>
              <input
                aria-label={`Título do tópico ${i + 1}`}
                defaultValue={t.titulo}
                key={t.titulo}
                onBlur={(e) => e.target.value !== t.titulo && renomear(t.id, e.target.value)}
              />
              <button className="secundario" onClick={() => setSelecionado(t.id)}>
                Conteúdo ({dados.questoes.filter((q) => q.topicoId === t.id).length} questões)
              </button>
              <button className="icone" aria-label={`Mover ${t.titulo} para cima`} disabled={i === 0} onClick={() => mover(i, -1)}>
                ↑
              </button>
              <button
                className="icone"
                aria-label={`Mover ${t.titulo} para baixo`}
                disabled={i === curso.topicos.length - 1}
                onClick={() => mover(i, 1)}
              >
                ↓
              </button>
              {removendo === t.id ? (
                <>
                  <button className="perigo" onClick={() => remover(t.id)}>
                    Confirmar remoção
                  </button>
                  <button className="secundario" onClick={() => setRemovendo(null)}>
                    Cancelar
                  </button>
                </>
              ) : (
                <button className="secundario" onClick={() => setRemovendo(t.id)}>
                  Remover
                </button>
              )}
            </li>
          ))}
        </ol>
        <form className="linha" onSubmit={adicionarTopico}>
          <label>
            Novo tópico
            <input value={novoTopico} onChange={(e) => setNovoTopico(e.target.value)} />
          </label>
          <button type="submit">Adicionar tópico</button>
        </form>
      </section>

      {topico && (
        <>
          <Materiais curso={curso} topico={topico} />
          <BancoQuestoes curso={curso} topico={topico} />
        </>
      )}
    </>
  );
}

function Materiais({ curso, topico }: { curso: Curso; topico: Topico }) {
  const { executar } = useApp();
  const [form, setForm] = useState({ tipo: 'texto' as TipoMaterial, titulo: '', conteudo: '' });
  const [erro, setErro] = useState('');

  const salvarMateriais = (materiais: Topico['materiais']) =>
    executar((r) =>
      r.salvarCurso({ ...curso, topicos: curso.topicos.map((t) => (t.id === topico.id ? { ...t, materiais } : t)) }),
    );

  const adicionar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.conteudo.trim()) {
      setErro('Informe título e conteúdo/link do material.');
      return;
    }
    setErro('');
    await salvarMateriais([...topico.materiais, { id: novoId('m'), ...form }]);
    setForm({ ...form, titulo: '', conteudo: '' });
  };

  return (
    <section className="cartao" aria-labelledby="titulo-materiais">
      <h2 id="titulo-materiais">Materiais de “{topico.titulo}”</h2>
      {topico.materiais.length === 0 ? (
        <Vazio>Nenhum material.</Vazio>
      ) : (
        <ul>
          {topico.materiais.map((m) => (
            <li key={m.id}>
              <span className="selo">{m.tipo}</span> {m.titulo}{' '}
              <button className="secundario" onClick={() => salvarMateriais(topico.materiais.filter((x) => x.id !== m.id))}>
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
      <form className="formulario" onSubmit={adicionar}>
        <label>
          Tipo
          <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoMaterial })}>
            <option value="texto">Texto</option>
            <option value="video">Vídeo (link)</option>
            <option value="arquivo">Arquivo (link)</option>
          </select>
        </label>
        <label>
          Título do material
          <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
        </label>
        <label>
          {form.tipo === 'texto' ? 'Texto' : 'Link (URL)'}
          {form.tipo === 'texto' ? (
            <textarea value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} />
          ) : (
            <input type="url" value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} />
          )}
        </label>
        {erro && <p className="erro-campo">{erro}</p>}
        <button type="submit">Adicionar material</button>
      </form>
    </section>
  );
}

const QUESTAO_VAZIA = { enunciado: '', alternativas: ['', '', '', ''], correta: null as number | null, explicacao: '', dificuldade: 'facil' as Dificuldade };

function BancoQuestoes({ curso, topico }: { curso: Curso; topico: Topico }) {
  const { dados, executar } = useApp();
  const [form, setForm] = useState(QUESTAO_VAZIA);
  const [erros, setErros] = useState<string[]>([]);
  const questoes = dados.questoes.filter((q) => q.cursoId === curso.id && q.topicoId === topico.id);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const encontrados = validarQuestao(form);
    setErros(encontrados);
    if (encontrados.length > 0) return;
    // descarta alternativas vazias, preservando a correta
    const indices = form.alternativas.map((a, i) => (a.trim() ? i : -1)).filter((i) => i >= 0);
    await executar((r) =>
      r.salvarQuestao({
        cursoId: curso.id,
        topicoId: topico.id,
        enunciado: form.enunciado.trim(),
        alternativas: indices.map((i) => form.alternativas[i].trim()),
        correta: indices.indexOf(form.correta!),
        explicacao: form.explicacao.trim(),
        dificuldade: form.dificuldade,
      }),
    );
    setForm({ ...QUESTAO_VAZIA, dificuldade: form.dificuldade });
  };

  return (
    <section className="cartao" aria-labelledby="titulo-questoes">
      <h2 id="titulo-questoes">Banco de questões de “{topico.titulo}”</h2>
      <p className="meta">
        {DIFICULDADES.map((d) => `${NOME_DIFICULDADE[d]}: ${questoes.filter((q) => q.dificuldade === d).length}`).join(' · ')}
      </p>
      {questoes.length === 0 ? (
        <Vazio>Nenhuma questão neste tópico.</Vazio>
      ) : (
        <ul className="lista-questoes">
          {questoes.map((q) => (
            <li key={q.id}>
              <EtiquetaDificuldade dificuldade={q.dificuldade} /> {q.enunciado}{' '}
              <small>(correta: {q.alternativas[q.correta]})</small>{' '}
              <button className="secundario" onClick={() => executar((r) => r.removerQuestao(q.id))}>
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
      <form className="formulario" onSubmit={salvar} noValidate aria-label="Nova questão">
        <h3>Nova questão</h3>
        <label>
          Enunciado
          <textarea value={form.enunciado} onChange={(e) => setForm({ ...form, enunciado: e.target.value })} />
        </label>
        <fieldset>
          <legend>Alternativas (marque a correta)</legend>
          {form.alternativas.map((alt, i) => (
            <div key={i} className="linha">
              <input
                type="radio"
                name="correta"
                aria-label={`Alternativa ${i + 1} é a correta`}
                checked={form.correta === i}
                onChange={() => setForm({ ...form, correta: i })}
              />
              <input
                aria-label={`Alternativa ${i + 1}`}
                value={alt}
                onChange={(e) =>
                  setForm({ ...form, alternativas: form.alternativas.map((a, j) => (j === i ? e.target.value : a)) })
                }
              />
            </div>
          ))}
        </fieldset>
        <label>
          Explicação
          <textarea value={form.explicacao} onChange={(e) => setForm({ ...form, explicacao: e.target.value })} />
        </label>
        <label>
          Dificuldade
          <select value={form.dificuldade} onChange={(e) => setForm({ ...form, dificuldade: e.target.value as Dificuldade })}>
            {DIFICULDADES.map((d) => (
              <option key={d} value={d}>
                {NOME_DIFICULDADE[d]}
              </option>
            ))}
          </select>
        </label>
        {erros.length > 0 && (
          <ul role="alert" className="erro-campo">
            {erros.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        <button type="submit">Salvar questão</button>
      </form>
    </section>
  );
}
