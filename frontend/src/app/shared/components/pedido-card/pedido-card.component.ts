import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { Pedido, StatusPedido } from '../../models/pedido.model';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

@Component({
  selector: 'app-pedido-card',
  standalone: true,
  imports: [
    DatePipe,
    NgFor,
    NgIf,
    StatusBadgeComponent,
    LucideAngularModule,
  ],
  template: `
    <article class="card-imperial pedido-card">
      <div class="pedido-topo">
        <div>
          <span class="eyebrow">Pedido #{{ pedido.numeroPedido }}</span>
          <h2>{{ pedido.nomeCliente }}</h2>
          <p>Ficha {{ pedido.numeroFicha }} · {{ pedido.criadoEm | date: 'HH:mm' }}</p>
        </div>
        <app-status-badge [status]="pedido.status" />
      </div>

      <ul class="itens-pedido">
        <li *ngFor="let item of pedido.itens">
          <strong>{{ item.quantidade }}x {{ item.produto }}</strong>
          <span *ngIf="item.observacao">{{ item.observacao }}</span>
        </li>
      </ul>

      <div class="pedido-acoes">
        <button
          type="button"
          class="btn-imperial"
          *ngIf="pedido.status === 'pendente'"
          (click)="statusChange.emit('em_producao')"
        >
          <i-lucide name="play" aria-hidden="true"></i-lucide>
          Iniciar
        </button>
        <button
          type="button"
          class="btn-imperial"
          *ngIf="pedido.status === 'em_producao'"
          (click)="statusChange.emit('pronto')"
        >
          <i-lucide name="package-check" aria-hidden="true"></i-lucide>
          Pronto
        </button>
        <button
          type="button"
          class="btn-secondary"
          *ngIf="pedido.status === 'pronto'"
          (click)="statusChange.emit('entregue')"
        >
          <i-lucide name="check" aria-hidden="true"></i-lucide>
          Entregue
        </button>
        <button
          type="button"
          class="btn-danger"
          *ngIf="pedido.status !== 'entregue' && pedido.status !== 'cancelado'"
          (click)="statusChange.emit('cancelado')"
        >
          <i-lucide name="trash-2" aria-hidden="true"></i-lucide>
          Cancelar
        </button>
      </div>
    </article>
  `,
})
export class PedidoCardComponent {
  @Input({ required: true }) pedido!: Pedido;
  @Output() statusChange = new EventEmitter<StatusPedido>();
}
