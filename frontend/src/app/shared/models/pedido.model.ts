import { ItemPedido } from './item-pedido.model';

export type StatusPedido =
  | 'pendente'
  | 'em_producao'
  | 'pronto'
  | 'entregue'
  | 'cancelado';

export interface Pedido {
  id: number;
  numeroPedido: number;
  nomeCliente: string;
  numeroFicha: number;
  status: StatusPedido;
  criadoEm: string;
  atualizadoEm: string;
  itens: ItemPedido[];
}

export interface CriarPedidoPayload {
  nomeCliente: string;
  numeroFicha: number;
  itens: ItemPedido[];
}

export interface PedidoPublico {
  numeroPedido: number;
  nomeCliente?: string;
  numeroFicha?: number;
  status?: StatusPedido;
  posicaoFila?: number | null;
  pedidosNaFrente?: number | null;
  mensagem: string;
  destaque?: string;
}

export interface PedidoEvento {
  tipo:
    | 'pedido_criado'
    | 'pedido_atualizado'
    | 'pedido_cancelado'
    | 'fichas_atualizadas';
  pedido?: Pedido;
  quantidadeFichas?: number;
  livres?: number[];
  ocupadas?: number[];
}
