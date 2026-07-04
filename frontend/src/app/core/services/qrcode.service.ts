import { Injectable } from '@angular/core';
import QRCode from 'qrcode';

@Injectable({ providedIn: 'root' })
export class QrcodeService {
  gerarDataUrl(texto: string): Promise<string> {
    return QRCode.toDataURL(texto, {
      margin: 1,
      width: 320,
      color: {
        dark: '#050505',
        light: '#ffffff',
      },
    });
  }
}
