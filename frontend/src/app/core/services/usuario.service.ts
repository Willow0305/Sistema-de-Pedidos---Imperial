import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AtualizarUsuarioPayload,
  CriarUsuarioPayload,
  Usuario,
} from '../../shared/models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${environment.apiUrl}/usuarios/`);
  }

  criar(payload: CriarUsuarioPayload): Observable<Usuario> {
    return this.http.post<Usuario>(`${environment.apiUrl}/usuarios/`, payload);
  }

  atualizar(id: number, payload: AtualizarUsuarioPayload): Observable<Usuario> {
    return this.http.put<Usuario>(`${environment.apiUrl}/usuarios/${id}/`, payload);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/usuarios/${id}/`);
  }
}
