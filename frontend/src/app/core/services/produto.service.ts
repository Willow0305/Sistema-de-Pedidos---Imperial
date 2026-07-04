import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Produto, ProdutoPayload } from '../../shared/models/produto.model';

@Injectable({ providedIn: 'root' })
export class ProdutoService {
  private readonly http = inject(HttpClient);

  listar(ativos = false): Observable<Produto[]> {
    const params = ativos ? '?ativos=true' : '';
    return this.http.get<Produto[]>(`${environment.apiUrl}/produtos/${params}`);
  }

  criar(payload: ProdutoPayload): Observable<Produto> {
    return this.http.post<Produto>(`${environment.apiUrl}/produtos/`, payload);
  }

  atualizar(id: number, payload: ProdutoPayload): Observable<Produto> {
    return this.http.put<Produto>(`${environment.apiUrl}/produtos/${id}/`, payload);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/produtos/${id}/`);
  }
}
