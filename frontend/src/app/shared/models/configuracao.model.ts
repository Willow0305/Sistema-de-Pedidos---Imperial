export interface ConfiguracaoSistema {
  nomeEstabelecimento: string;
  quantidadeFichas: number;
  mensagemCliente: string;
  mensagemPedidoPronto: string;
  caixaPodeConfigurar: boolean;
  intervaloAtualizacaoSegundos: number;
  exibirPedidosProntosNaProducao: boolean;
}

export type ConfiguracaoPublica = Pick<
  ConfiguracaoSistema,
  | 'nomeEstabelecimento'
  | 'mensagemCliente'
  | 'mensagemPedidoPronto'
  | 'intervaloAtualizacaoSegundos'
>;
