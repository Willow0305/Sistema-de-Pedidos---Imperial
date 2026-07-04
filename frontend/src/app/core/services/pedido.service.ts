import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CriarPedidoPayload,
  Pedido,
  PedidoPublico,
  StatusPedido,
} from '../../shared/models/pedido.model';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly http = inject(HttpClient);

  consultarPublico(numeroFicha: number): Observable<PedidoPublico> {
    return this.http.get<PedidoPublico>(
      `${environment.apiUrl}/publico/pedidos/${numeroFicha}/`,
    );
  }

  listarAtivos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${environment.apiUrl}/pedidos/ativos/`);
  }

  criar(payload: CriarPedidoPayload): Observable<Pedido> {
    return this.http.post<Pedido>(`${environment.apiUrl}/pedidos/`, payload);
  }

  atualizarStatus(id: number, status: StatusPedido): Observable<Pedido> {
    return this.http.put<Pedido>(`${environment.apiUrl}/pedidos/${id}/status/`, {
      status,
    });
  }

  nomesClientes(): Observable<{ nomes: string[] }> {
    return this.http.get<{ nomes: string[] }>(`${environment.apiUrl}/clientes/nomes/`);
  }
}
