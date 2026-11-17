import { describe, expect, it } from 'vitest';
import { criarFixtureAcademica } from '../testes/fixtures-academicas';
import {
  validarDisciplina, validarGraduacao, validarMatricula, validarPeriodoLetivo, validarTurma,
  validarVinculoCoordenador, validarVinculoProfessor, validarVinculoResponsavel,
} from './academico';
import { validarUsuario } from './usuarios';
import { VERSAO_SCHEMA_ACADEMICO, type DadosAcademicos } from './tipos';

describe('D1 / D8 — Contrato do documento acadêmico, sem migração', () => {
  it('preserva metadados, funções e relações em uma serialização JSON completa', () => {
    const dados = criarFixtureAcademica();
    const reconstituido = JSON.parse(JSON.stringify(dados)) as DadosAcademicos;
    expect(reconstituido).toEqual(dados);
    expect(reconstituido).toMatchObject({ versaoSchema: VERSAO_SCHEMA_ACADEMICO, versaoSeed: 1, revisao: 0, dataVirtual: '2026-11-17' });
    expect(reconstituido.usuarios[1].funcoes).toEqual(['professor', 'coordenador']);
    expect(reconstituido).not.toHaveProperty('cursos');
    expect(reconstituido.matriculas[0]).not.toHaveProperty('cursoId');
  });

  it('entrega uma fixture coerente com os validadores de todos os cadastros e vínculos', () => {
    const d = criarFixtureAcademica();
    for (const u of d.usuarios) expect(validarUsuario(u)).toEqual({});
    for (const g of d.graduacoes) expect(validarGraduacao(g, d.graduacoes)).toEqual({});
    for (const disciplina of d.disciplinas) expect(validarDisciplina(disciplina, d.graduacoes, d.disciplinas)).toEqual({});
    for (const p of d.periodosLetivos) expect(validarPeriodoLetivo(p)).toEqual({});
    for (const t of d.turmas) expect(validarTurma(t, d.disciplinas, d.periodosLetivos, d.turmas)).toEqual({});
    for (const m of d.matriculas) expect(validarMatricula(m, d.usuarios, d.turmas, []).erros).toEqual({});
    for (const v of d.vinculosProfessor) expect(validarVinculoProfessor(v, d.usuarios, d.turmas, []).erros).toEqual({});
    for (const v of d.vinculosCoordenador) expect(validarVinculoCoordenador(v, d.usuarios, d.graduacoes, []).erros).toEqual({});
    for (const v of d.vinculosResponsavel) expect(validarVinculoResponsavel(v, d.usuarios, []).erros).toEqual({});
  });

  it('renomear códigos ou nomes não muda as identidades das matrículas e vínculos serializados', () => {
    const d = criarFixtureAcademica();
    const antes = JSON.parse(JSON.stringify(d)) as DadosAcademicos;
    d.graduacoes[0].codigo = 'SI-ATUAL';
    d.graduacoes[0].nome = 'Graduação renomeada';
    d.disciplinas[0].codigo = 'ALG-ATUAL';
    d.turmas[0].codigo = 'B';
    d.periodosLetivos[0].nome = 'Período renomeado';
    expect(validarGraduacao(d.graduacoes[0], d.graduacoes)).toEqual({});
    expect(validarDisciplina(d.disciplinas[0], d.graduacoes, d.disciplinas)).toEqual({});
    expect(validarTurma(d.turmas[0], d.disciplinas, d.periodosLetivos, d.turmas)).toEqual({});
    const depois = JSON.parse(JSON.stringify(d)) as DadosAcademicos;
    for (const colecao of ['matriculas', 'vinculosProfessor', 'vinculosCoordenador', 'vinculosResponsavel'] as const) {
      expect(depois[colecao]).toEqual(antes[colecao]);
    }
    expect(depois.graduacoes[0].id).toBe(antes.graduacoes[0].id);
    expect(depois.disciplinas[0].id).toBe(antes.disciplinas[0].id);
    expect(depois.turmas[0].id).toBe(antes.turmas[0].id);
    expect(depois.periodosLetivos[0].id).toBe(antes.periodosLetivos[0].id);
  });

  it('não compartilha objetos entre chamadas nem altera os dados locais anteriores', () => {
    const chave = 'trilha-adaptativa:dados';
    const bruto = '{"versaoSeed":1,"dados":"demonstracao-legada"}';
    localStorage.setItem(chave, bruto);
    const primeira = criarFixtureAcademica();
    primeira.usuarios[0].funcoes.push('professor');
    primeira.disciplinas[0].topicos.push({ id: 't-novo', titulo: 'Novo', materiais: [] });
    const outra = criarFixtureAcademica();
    expect(outra.usuarios[0].funcoes).toEqual(['aluno']);
    expect(outra.disciplinas[0].topicos).toEqual([]);
    expect(outra.respostas).toEqual([]);
    expect(localStorage.getItem(chave)).toBe(bruto);
    expect(localStorage.length).toBe(1);
  });
});
