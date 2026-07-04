import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ConfiguracaoPublica,
  ConfiguracaoSistema,
} from '../../shared/models/configuracao.model';

@Injectable({ providedIn: 'root' })
export class ConfiguracaoService {
  private readonly http = inject(HttpClient);

  publica(): Observable<ConfiguracaoPublica> {
    return this.http.get<ConfiguracaoPublica>(
      `${environment.apiUrl}/publico/configuracoes/`,
    );
  }

  obter(): Observable<ConfiguracaoSistema> {
    return this.http.get<ConfiguracaoSistema>(`${environment.apiUrl}/configuracoes/`);
  }

  salvar(configuracao: ConfiguracaoSistema): Observable<ConfiguracaoSistema> {
    return this.http.put<ConfiguracaoSistema>(
      `${environment.apiUrl}/configuracoes/`,
      configuracao,
    );
  }
}
