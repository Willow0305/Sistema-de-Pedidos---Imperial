import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { QrcodeService } from '../../core/services/qrcode.service';
import { ImperialHeaderComponent } from '../../shared/components/imperial-header/imperial-header.component';

interface QrCodeItem {
  titulo: string;
  destino: string;
  uso: string;
  arquivo: string;
  dataUrl: string;
}

@Component({
  selector: 'app-qrcodes',
  standalone: true,
  imports: [
    ImperialHeaderComponent,
    LucideAngularModule,
    NgFor,
    NgIf,
  ],
  templateUrl: './qrcodes.component.html',
  styleUrl: './qrcodes.component.scss',
})
export class QrcodesComponent implements OnInit {
  private readonly qrcodeService = inject(QrcodeService);
  private readonly enderecoRedeLocal = '192.168.1.12';

  qrcodes: QrCodeItem[] = [];
  carregando = true;

  ngOnInit(): void {
    void this.gerar();
  }

  imprimir(): void {
    window.print();
  }

  private async gerar(): Promise<void> {
    const origem = this.origemPublica();
    const base = [
      {
        titulo: 'QR Code do Cliente',
        destino: `${origem}/cliente`,
        uso: 'Público para consulta de pedidos.',
        arquivo: 'qrcode-cliente-imperial.png',
      },
      {
        titulo: 'QR Code Interno',
        destino: `${origem}/login`,
        uso: 'Equipe com autenticação obrigatória.',
        arquivo: 'qrcode-interno-imperial.png',
      },
    ];

    this.qrcodes = await Promise.all(
      base.map(async (item) => ({
        ...item,
        dataUrl: await this.qrcodeService.gerarDataUrl(item.destino),
      })),
    );
    this.carregando = false;
  }

  private origemPublica(): string {
    const { protocol, hostname, port, origin } = window.location;
    const abertoLocalmente = hostname === 'localhost' || hostname === '127.0.0.1';

    if (!abertoLocalmente) {
      return origin;
    }

    const porta = port ? `:${port}` : '';
    return `${protocol}//${this.enderecoRedeLocal}${porta}`;
  }
}
