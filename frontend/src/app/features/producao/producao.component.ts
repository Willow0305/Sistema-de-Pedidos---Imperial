import { NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription, finalize } from 'rxjs';

import { ConfiguracaoService } from '../../core/services/configuracao.service';
import { PedidoService } from '../../core/services/pedido.service';
import { WebsocketService } from '../../core/services/websocket.service';
import { ImperialHeaderComponent } from '../../shared/components/imperial-header/imperial-header.component';
import { PedidoCardComponent } from '../../shared/components/pedido-card/pedido-card.component';
import { ConfiguracaoSistema } from '../../shared/models/configuracao.model';
import { Pedido, StatusPedido } from '../../shared/models/pedido.model';

type FiltroProducao = 'todos' | 'pendente' | 'em_producao' | 'pronto';

@Component({
  selector: 'app-producao',
  standalone: true,
  imports: [
    ImperialHeaderComponent,
    NgFor,
    NgIf,
    PedidoCardComponent,
  ],
  templateUrl: './producao.component.html',
  styleUrl: './producao.component.scss',
})
export class ProducaoComponent implements OnInit, OnDestroy {
  private readonly pedidoService = inject(PedidoService);
  private readonly configuracaoService = inject(ConfiguracaoService);
  private readonly websocketService = inject(WebsocketService);
  private readonly subscriptions = new Subscription();
  private fallbackTimer?: number;

  pedidos: Pedido[] = [];
  filtro: FiltroProducao = 'todos';
  carregando = true;
  erro = '';
  atualizandoId?: number;
  configuracao?: ConfiguracaoSistema;

  get pedidosFiltrados(): Pedido[] {
    if (this.filtro === 'todos') {
      return this.pedidos;
    }

    return this.pedidos.filter((pedido) => pedido.status === this.filtro);
  }

  ngOnInit(): void {
    this.carregarConfiguracao();
    this.carregarPedidos();
    this.websocketService.connect();

    this.subscriptions.add(
      this.websocketService.eventos$.subscribe((evento) => {
        if (evento.pedido) {
          this.sincronizarPedido(evento.pedido);
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    window.clearInterval(this.fallbackTimer);
    this.websocketService.disconnect();
  }

  setFiltro(filtro: FiltroProducao): void {
    this.filtro = filtro;
  }

  quantidade(status: FiltroProducao): number {
    if (status === 'todos') {
      return this.pedidos.length;
    }

    return this.pedidos.filter((pedido) => pedido.status === status).length;
  }

  atualizarStatus(pedido: Pedido, status: StatusPedido): void {
    this.erro = '';
    this.atualizandoId = pedido.id;

    this.pedidoService
      .atualizarStatus(pedido.id, status)
      .pipe(finalize(() => (this.atualizandoId = undefined)))
      .subscribe({
        next: (pedidoAtualizado) => this.sincronizarPedido(pedidoAtualizado),
        error: () => {
          this.erro = 'Não foi possível atualizar o pedido.';
        },
      });
  }

  private carregarPedidos(): void {
    this.carregando = true;
    this.pedidoService
      .listarAtivos()
      .pipe(finalize(() => (this.carregando = false)))
      .subscribe({
        next: (pedidos) => {
          this.pedidos = pedidos;
        },
        error: () => {
          this.erro = 'Não foi possível carregar os pedidos.';
        },
      });
  }

  private carregarConfiguracao(): void {
    this.configuracaoService.obter().subscribe({
      next: (configuracao) => {
        this.configuracao = configuracao;
        const segundos = Math.max(configuracao.intervaloAtualizacaoSegundos, 5);
        window.clearInterval(this.fallbackTimer);
        this.fallbackTimer = window.setInterval(() => this.carregarPedidos(), segundos * 1000);
      },
    });
  }

  private sincronizarPedido(pedido: Pedido): void {
    const ativo = ['pendente', 'em_producao', 'pronto'].includes(pedido.status);
    const ocultarPronto =
      pedido.status === 'pronto' &&
      this.configuracao &&
      !this.configuracao.exibirPedidosProntosNaProducao;

    if (!ativo || ocultarPronto) {
      this.pedidos = this.pedidos.filter((item) => item.id !== pedido.id);
      return;
    }

    const index = this.pedidos.findIndex((item) => item.id === pedido.id);
    if (index >= 0) {
      this.pedidos[index] = pedido;
    } else {
      this.pedidos = [...this.pedidos, pedido];
    }

    this.pedidos = [...this.pedidos].sort(
      (a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime(),
    );
  }
}
