import { FUNCOES, type Usuario } from './tipos';
import type { ErrosAcademicos } from './academico';

/** Valida o novo contrato; não traduz perfil legado nem deduz funções de vínculos. */
export function validarUsuario(usuario: Usuario): ErrosAcademicos {
  const erros: ErrosAcademicos = {};
  if (!Array.isArray(usuario.funcoes)) {
    erros.funcoes = 'Informe as funções da pessoa.';
    return erros;
  }
  if (usuario.funcoes.some((funcao) => !FUNCOES.includes(funcao))) {
    erros.funcoes = 'Há função não suportada.';
  } else if (new Set(usuario.funcoes).size !== usuario.funcoes.length) {
    erros.funcoes = 'As funções não podem ser repetidas.';
  } else if (usuario.ativo && usuario.funcoes.length === 0) {
    erros.funcoes = 'Uma pessoa ativa precisa de ao menos uma função.';
  }
  return erros;
}
