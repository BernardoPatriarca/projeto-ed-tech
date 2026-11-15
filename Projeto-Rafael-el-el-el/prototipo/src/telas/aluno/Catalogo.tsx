import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp, useUsuario } from '../../app/contexto';
import { filtrarCatalogo, opcoesCatalogo, type FiltroCatalogo } from '../../catalogo/filtro';
import { Vazio } from '../../componentes/comuns';

export function Catalogo() {
  const { dados } = useApp();
  const usuario = useUsuario();
  const [filtro, setFiltro] = useState<FiltroCatalogo>({ texto: '', area: '', nivel: '' });
  const { areas, niveis } = opcoesCatalogo(dados.cursos);
  const cursos = filtrarCatalogo(dados.cursos, filtro);
  const matriculado = (cursoId: string) =>
    dados.matriculas.some((m) => m.alunoId === usuario.id && m.cursoId === cursoId);

  return (
    <>
      <h1>Catálogo de cursos</h1>
      <form className="filtros" role="search" onSubmit={(e) => e.preventDefault()}>
        <label>
          Buscar pelo título
          <input
            type="search"
            value={filtro.texto}
            onChange={(e) => setFiltro({ ...filtro, texto: e.target.value })}
            placeholder="Ex.: Matemática"
          />
        </label>
        <label>
          Área
          <select value={filtro.area} onChange={(e) => setFiltro({ ...filtro, area: e.target.value })}>
            <option value="">Todas</option>
            {areas.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <label>
          Nível
          <select value={filtro.nivel} onChange={(e) => setFiltro({ ...filtro, nivel: e.target.value })}>
            <option value="">Todos</option>
            {niveis.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      </form>

      {cursos.length === 0 ? (
        <Vazio>Nenhum curso encontrado. Tente outro termo ou limpe os filtros.</Vazio>
      ) : (
        <ul className="grade-cartoes lista-limpa">
          {cursos.map((c) => (
            <li key={c.id} className="cartao">
              <h2>
                <Link to={`/aluno/cursos/${c.id}`}>{c.titulo}</Link>
              </h2>
              <p>{c.descricaoCurta}</p>
              <p className="meta">
                {c.area} · {c.nivel} · {c.topicos.length} tópicos
              </p>
              {matriculado(c.id) && <span className="selo ok">Matriculado</span>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
