import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';

import { StatusPedido } from '../../models/pedido.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span class="status-badge" [ngClass]="status">
      {{ label }}
    </span>
  `,
})
export class StatusBadgeComponent {
  @Input() status?: StatusPedido;

  get label(): string {
    const labels: Record<StatusPedido, string> = {
      pendente: 'Pendente',
      em_producao: 'Em produção',
      pronto: 'Pronto',
      entregue: 'Entregue',
      cancelado: 'Cancelado',
    };

    return this.status ? labels[this.status] : 'Sem status';
  }
}
