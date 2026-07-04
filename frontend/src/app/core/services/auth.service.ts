import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LoginResponse, PerfilUsuario, Usuario } from '../../shared/models/usuario.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenKey = 'imperial_token';
  private readonly usuarioKey = 'imperial_usuario';
  private readonly usuarioSubject = new BehaviorSubject<Usuario | null>(
    this.loadUsuario(),
  );

  readonly usuario$ = this.usuarioSubject.asObservable();

  get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  get usuarioAtual(): Usuario | null {
    return this.usuarioSubject.value;
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login/`, {
        username,
        password,
      })
      .pipe(
        tap((response) => {
          localStorage.setItem(this.tokenKey, response.token);
          localStorage.setItem(this.usuarioKey, JSON.stringify(response.usuario));
          this.usuarioSubject.next(response.usuario);
        }),
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.usuarioKey);
    this.usuarioSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.usuarioAtual;
  }

  hasRole(roles: PerfilUsuario[]): boolean {
    const usuario = this.usuarioAtual;
    return !!usuario && roles.includes(usuario.perfil);
  }

  rotaInicial(): string {
    const perfil = this.usuarioAtual?.perfil;
    if (perfil === 'ADMIN') {
      return '/admin';
    }
    if (perfil === 'CAIXA') {
      return '/caixa';
    }
    if (perfil === 'PRODUCAO') {
      return '/producao';
    }
    return '/login';
  }

  private loadUsuario(): Usuario | null {
    const raw = localStorage.getItem(this.usuarioKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as Usuario;
    } catch {
      localStorage.removeItem(this.usuarioKey);
      localStorage.removeItem(this.tokenKey);
      return null;
    }
  }
}
