export interface Produto {
  id: number;
  nome: string;
  ativo: boolean;
}

export interface ProdutoPayload {
  nome: string;
  ativo: boolean;
}
