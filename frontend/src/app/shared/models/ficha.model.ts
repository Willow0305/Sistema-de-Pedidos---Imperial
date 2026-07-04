export interface FichasResumo {
  quantidadeFichas: number;
  livres: number[];
  ocupadas: number[];
}

export interface DisponibilidadeFicha {
  numeroFicha: number;
  livre: boolean;
}
