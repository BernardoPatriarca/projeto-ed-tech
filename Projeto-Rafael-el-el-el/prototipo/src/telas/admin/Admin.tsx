import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../app/contexto';
import { NOME_PERFIL, PERFIS, type Perfil, type UsuarioLegado as Usuario } from '../../dominio/tipos';

export function totaisPlataforma(dados: ReturnType<typeof useApp>['dados']) {
  return {
    usuariosPorPerfil: PERFIS.map((perfil) => ({
      perfil,
      total: dados.usuarios.filter((u) => u.perfil === perfil).length,
      ativos: dados.usuarios.filter((u) => u.perfil === perfil && u.ativo).length,
    })),
    cursosPorStatus: {
      publicado: dados.cursos.filter((c) => c.status === 'publicado').length,
      rascunho: dados.cursos.filter((c) => c.status === 'rascunho').length,
    },
    matriculas: dados.matriculas.length,
  };
}

export function VisaoGeral() {
  const { dados } = useApp();
  const t = totaisPlataforma(dados);
  return (
    <>
      <h1>Visão geral da plataforma</h1>
      <h2>Usuários por perfil</h2>
      <div className="indicadores">
        {t.usuariosPorPerfil.map((p) => (
          <div key={p.perfil} className="indicador" data-testid={`total-${p.perfil}`}>
            <span className="rotulo">{NOME_PERFIL[p.perfil]}</span>
            <strong className="numero">{p.total}</strong>
            <small>{p.ativos} ativos</small>
          </div>
        ))}
      </div>
      <h2>Cursos e matrículas</h2>
      <div className="indicadores">
        <div className="indicador" data-testid="total-publicados">
          <span className="rotulo">Cursos publicados</span>
          <strong className="numero">{t.cursosPorStatus.publicado}</strong>
        </div>
        <div className="indicador" data-testid="total-rascunhos">
          <span className="rotulo">Cursos em rascunho</span>
          <strong className="numero">{t.cursosPorStatus.rascunho}</strong>
        </div>
        <div className="indicador" data-testid="total-matriculas">
          <span className="rotulo">Matrículas</span>
          <strong className="numero">{t.matriculas}</strong>
        </div>
      </div>
    </>
  );
}

const USUARIO_VAZIO = { nome: '', email: '', perfil: 'aluno' as Perfil };

export function Usuarios() {
  const { dados, executar } = useApp();
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [form, setForm] = useState(USUARIO_VAZIO);
  const [erro, setErro] = useState('');

  const editar = (u: Usuario) => {
    setEditando(u);
    setForm({ nome: u.nome, email: u.email, perfil: u.perfil });
    setErro('');
  };
  const cancelar = () => {
    setEditando(null);
    setForm(USUARIO_VAZIO);
    setErro('');
  };
  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.email.trim()) {
      setErro('Informe nome e e-mail.');
      return;
    }
    await executar((r) =>
      r.salvarUsuario({ id: editando?.id, ativo: editando?.ativo ?? true, nome: form.nome.trim(), email: form.email.trim(), perfil: form.perfil }),
    );
    cancelar();
  };

  return (
    <>
      <h1>Usuários</h1>
      <form className="formulario cartao" onSubmit={salvar} noValidate>
        <h2>{editando ? `Editar ${editando.nome}` : 'Novo usuário'}</h2>
        <label>
          Nome
          <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </label>
        <label>
          E-mail
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label>
          Perfil
          <select value={form.perfil} onChange={(e) => setForm({ ...form, perfil: e.target.value as Perfil })}>
            {PERFIS.map((p) => (
              <option key={p} value={p}>
                {NOME_PERFIL[p]}
              </option>
            ))}
          </select>
        </label>
        {erro && <p className="erro-campo">{erro}</p>}
        <div className="acoes">
          <button type="submit">{editando ? 'Salvar alterações' : 'Criar usuário'}</button>
          {editando && (
            <button type="button" className="secundario" onClick={cancelar}>
              Cancelar
            </button>
          )}
        </div>
      </form>
      <table>
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">E-mail</th>
            <th scope="col">Perfil</th>
            <th scope="col">Status</th>
            <th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody>
          {dados.usuarios.map((u) => (
            <tr key={u.id} className={u.ativo ? '' : 'inativo'}>
              <td>{u.nome}</td>
              <td>{u.email}</td>
              <td>{NOME_PERFIL[u.perfil]}</td>
              <td>{u.ativo ? 'Ativo' : <span className="selo">Inativo</span>}</td>
              <td className="acoes-tabela">
                <button className="secundario" onClick={() => editar(u)}>
                  Editar
                </button>
                <button className="secundario" onClick={() => executar((r) => r.definirAtivo(u.id, !u.ativo))}>
                  {u.ativo ? `Desativar ${u.nome}` : `Reativar ${u.nome}`}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export function Vinculos() {
  const { dados, executar } = useApp();
  const alunos = dados.usuarios.filter((u) => u.perfil === 'aluno');
  const responsaveis = dados.usuarios.filter((u) => u.perfil === 'responsavel');
  const professores = dados.usuarios.filter((u) => u.perfil === 'professor');

  return (
    <>
      <h1>Vínculos</h1>
      <section className="cartao">
        <h2>Responsável ↔ Aluno</h2>
        {responsaveis.map((r) => (
          <fieldset key={r.id}>
            <legend>{r.nome}</legend>
            {alunos.map((a) => (
              <label key={a.id} className="check">
                <input
                  type="checkbox"
                  checked={dados.vinculosResponsavel.some((v) => v.responsavelId === r.id && v.alunoId === a.id)}
                  onChange={(e) => executar((repo) => repo.definirVinculoResponsavel(r.id, a.id, e.target.checked))}
                />
                {a.nome}
              </label>
            ))}
          </fieldset>
        ))}
      </section>
      <section className="cartao">
        <h2>Professor ↔ Curso</h2>
        {dados.cursos.map((c) => (
          <fieldset key={c.id}>
            <legend>
              {c.titulo} <small>({c.status})</small>
            </legend>
            {professores.map((p) => (
              <label key={p.id} className="check">
                <input
                  type="checkbox"
                  checked={dados.vinculosProfessor.some((v) => v.professorId === p.id && v.cursoId === c.id)}
                  onChange={(e) => executar((repo) => repo.definirVinculoProfessor(p.id, c.id, e.target.checked))}
                />
                {p.nome}
                {!p.ativo && ' (inativo)'}
              </label>
            ))}
          </fieldset>
        ))}
      </section>
    </>
  );
}

export function CursosAdmin() {
  const { dados } = useApp();
  return (
    <>
      <h1>Todos os cursos</h1>
      <table>
        <thead>
          <tr>
            <th scope="col">Curso</th>
            <th scope="col">Status</th>
            <th scope="col">Professores</th>
            <th scope="col">Matrículas</th>
            <th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody>
          {dados.cursos.map((c) => (
            <tr key={c.id}>
              <td>{c.titulo}</td>
              <td>
                <span className={`selo ${c.status === 'publicado' ? 'ok' : ''}`}>{c.status}</span>
              </td>
              <td>
                {dados.vinculosProfessor
                  .filter((v) => v.cursoId === c.id)
                  .map((v) => dados.usuarios.find((u) => u.id === v.professorId)?.nome)
                  .join(', ') || '—'}
              </td>
              <td>{dados.matriculas.filter((m) => m.cursoId === c.id).length}</td>
              <td>
                <Link to={`/admin/cursos/${c.id}`}>Editar</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
