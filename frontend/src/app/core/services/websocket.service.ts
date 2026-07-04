import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PedidoEvento } from '../../shared/models/pedido.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private readonly auth = inject(AuthService);
  private socket?: WebSocket;
  private reconnectTimer?: number;
  private readonly eventosSubject = new Subject<PedidoEvento>();

  readonly eventos$ = this.eventosSubject.asObservable();

  connect(): void {
    if (this.socket || !this.auth.token) {
      return;
    }

    const token = encodeURIComponent(this.auth.token);
    this.socket = new WebSocket(`${environment.wsUrl}/ws/pedidos/?token=${token}`);

    this.socket.onmessage = (event) => {
      try {
        this.eventosSubject.next(JSON.parse(event.data) as PedidoEvento);
      } catch {
        // Eventos invalidos sao ignorados para manter a tela operacional.
      }
    };

    this.socket.onclose = () => {
      this.socket = undefined;
      if (this.auth.token) {
        window.clearTimeout(this.reconnectTimer);
        this.reconnectTimer = window.setTimeout(() => this.connect(), 3000);
      }
    };
  }

  disconnect(): void {
    window.clearTimeout(this.reconnectTimer);
    this.socket?.close();
    this.socket = undefined;
  }
}
