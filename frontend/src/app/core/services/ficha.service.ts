import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { DisponibilidadeFicha, FichasResumo } from '../../shared/models/ficha.model';

@Injectable({ providedIn: 'root' })
export class FichaService {
  private readonly http = inject(HttpClient);

  listar(): Observable<FichasResumo> {
    return this.http.get<FichasResumo>(`${environment.apiUrl}/fichas/`);
  }

  disponibilidade(numeroFicha: number): Observable<DisponibilidadeFicha> {
    return this.http.get<DisponibilidadeFicha>(
      `${environment.apiUrl}/fichas/${numeroFicha}/disponibilidade/`,
    );
  }
}
