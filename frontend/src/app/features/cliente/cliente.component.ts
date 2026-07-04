import { HttpErrorResponse } from '@angular/common/http';
import { NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EMPTY, Subscription, catchError, finalize, timer } from 'rxjs';

import { ConfiguracaoService } from '../../core/services/configuracao.service';
import { PedidoService } from '../../core/services/pedido.service';
import { ConfiguracaoPublica } from '../../shared/models/configuracao.model';
import { PedidoPublico } from '../../shared/models/pedido.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [FormsModule, NgIf, StatusBadgeComponent],
  templateUrl: './cliente.component.html',
  styleUrl: './cliente.component.scss',
})
export class ClienteComponent implements OnInit, OnDestroy {
  private readonly pedidoService = inject(PedidoService);
  private readonly configuracaoService = inject(ConfiguracaoService);
  private autoRefresh?: Subscription;

  numeroFicha: number | null = null;
  resultado?: PedidoPublico;
  carregando = false;
  erro = '';
  configuracao: ConfiguracaoPublica = {
    nomeEstabelecimento: 'A.A.A Imperial',
    mensagemCliente: 'Digite o número da sua ficha para acompanhar o andamento.',
    mensagemPedidoPronto: 'Seu pedido está pronto. Você já pode ir buscar.',
    intervaloAtualizacaoSegundos: 10,
  };

  ngOnInit(): void {
    this.configuracaoService.publica().subscribe({
      next: (configuracao) => {
        this.configuracao = configuracao;
      },
    });
  }

  ngOnDestroy(): void {
    this.autoRefresh?.unsubscribe();
  }

  consultar(manual = true): void {
    if (!this.numeroFicha || this.numeroFicha < 1) {
      this.erro = 'Informe um numero de ficha valido.';
      this.resultado = undefined;
      return;
    }

    if (manual) {
      this.autoRefresh?.unsubscribe();
    }

    this.carregando = true;
    this.erro = '';

    this.pedidoService
      .consultarPublico(this.numeroFicha)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.resultado = error.error as PedidoPublico;
          return EMPTY;
        }),
        finalize(() => {
          this.carregando = false;
          this.agendarAtualizacao();
        }),
      )
      .subscribe((pedido) => {
        this.resultado = pedido;
      });
  }

  private agendarAtualizacao(): void {
    this.autoRefresh?.unsubscribe();

    if (!this.resultado?.status || !['pendente', 'em_producao'].includes(this.resultado.status)) {
      return;
    }

    const segundos = Math.max(this.configuracao.intervaloAtualizacaoSegundos || 10, 5);
    this.autoRefresh = timer(segundos * 1000).subscribe(() => this.consultar(false));
  }
}

