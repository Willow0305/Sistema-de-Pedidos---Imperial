export type PerfilUsuario = 'ADMIN' | 'CAIXA' | 'PRODUCAO';

export interface Usuario {
  id: number;
  username?: string;
  nome: string;
  perfil: PerfilUsuario;
  ativo?: boolean;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface CriarUsuarioPayload {
  username: string;
  nome: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  password: string;
}

export interface AtualizarUsuarioPayload {
  username: string;
  nome: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  password?: string;
}
