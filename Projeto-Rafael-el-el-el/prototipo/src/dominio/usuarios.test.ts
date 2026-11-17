import { describe, expect, it } from 'vitest';
import { validarUsuario } from './usuarios';
import { validarVinculoProfessor } from './academico';
import { FUNCOES, NOME_FUNCAO, type Usuario } from './tipos';

const carla: Usuario = {
  id: 'u-carla', nome: 'Carla', email: 'carla@exemplo.com', ativo: true,
  funcoes: ['professor', 'coordenador'],
};

describe('PA — Funções de usuário suportadas', () => {
  it('aceita Professor e Coordenador em uma única identidade, sem perfil principal', () => {
    const antes = structuredClone(carla);
    expect(validarUsuario(carla)).toEqual({});
    expect(carla).toEqual(antes);
    expect(carla).not.toHaveProperty('perfil');
    expect(carla.id).toBe('u-carla');
  });

  it.each(FUNCOES)('aceita a função %s explicitamente atribuída', (funcao) => {
    expect(validarUsuario({ ...carla, funcoes: [funcao] })).toEqual({});
    expect(NOME_FUNCAO[funcao]).toBeTruthy();
  });

  it('rejeita pessoa ativa sem função, sem completar automaticamente a lista', () => {
    const usuario = { ...carla, funcoes: [] };
    expect(validarUsuario(usuario)).toHaveProperty('funcoes');
    expect(usuario.funcoes).toEqual([]);
  });

  it('não exige função de pessoa inativa para conservar seu cadastro histórico', () => {
    expect(validarUsuario({ ...carla, ativo: false, funcoes: [] })).toEqual({});
  });

  it('rejeita funções duplicadas sem normalizar silenciosamente o cadastro', () => {
    const usuario: Usuario = { ...carla, funcoes: ['professor', 'professor'] };
    expect(validarUsuario(usuario)).toHaveProperty('funcoes');
    expect(usuario.funcoes).toEqual(['professor', 'professor']);
  });

  it('rejeita função desconhecida proveniente de dados externos', () => {
    const usuario = JSON.parse(JSON.stringify({ ...carla, funcoes: ['monitor'] })) as Usuario;
    expect(validarUsuario(usuario)).toHaveProperty('funcoes');
  });

  it('não aceita perfil legado como substituto da lista de funções', () => {
    const legado = JSON.parse('{"id":"u1","perfil":"professor","ativo":true}') as Usuario;
    expect(validarUsuario(legado)).toHaveProperty('funcoes');
  });

  it('a validação estrutural de vínculo não atribui a função Professor à pessoa', () => {
    const usuario: Usuario = { ...carla, funcoes: ['coordenador'] };
    const antes = structuredClone(usuario);
    validarVinculoProfessor({ professorId: usuario.id, turmaId: 't1' }, [usuario], [
      { id: 't1', codigo: 'A', disciplinaId: 'd1', periodoLetivoId: 'p1' },
    ], []);
    expect(usuario).toEqual(antes);
    expect(usuario.funcoes).toEqual(['coordenador']);
  });
});
