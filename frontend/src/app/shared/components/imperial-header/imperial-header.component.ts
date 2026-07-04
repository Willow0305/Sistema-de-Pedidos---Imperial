import { NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '../../../core/services/auth.service';
import { ConfiguracaoService } from '../../../core/services/configuracao.service';

@Component({
  selector: 'app-imperial-header',
  standalone: true,
  imports: [
    NgIf,
    RouterLink,
    RouterLinkActive,
    LucideAngularModule,
  ],
  template: `
    <header class="imperial-header">
        <a class="brand" [routerLink]="auth.rotaInicial()" aria-label="Inicio">
        <img src="assets/logo_imperial.png" alt="Escudo Imperial" />
        <span>
          <strong>Sistema Imperial</strong>
          <small *ngIf="auth.usuarioAtual as usuario">{{ usuario.nome }} · {{ usuario.perfil }}</small>
        </span>
      </a>

      <nav aria-label="Navegacao interna">
        <a routerLink="/admin" routerLinkActive="active" *ngIf="podeVerAdmin">
          <i-lucide name="home" aria-hidden="true"></i-lucide>
          <span>Início</span>
        </a>
        <a routerLink="/caixa" routerLinkActive="active" *ngIf="podeVerCaixa">
          <i-lucide name="clipboard-list" aria-hidden="true"></i-lucide>
          <span>Caixa</span>
        </a>
        <a routerLink="/producao" routerLinkActive="active" *ngIf="podeVerProducao">
          <i-lucide name="chef-hat" aria-hidden="true"></i-lucide>
          <span>Produção</span>
        </a>
        <a routerLink="/qrcodes" routerLinkActive="active">
          <i-lucide name="qr-code" aria-hidden="true"></i-lucide>
          <span>QR</span>
        </a>
        <a routerLink="/usuarios" routerLinkActive="active" *ngIf="podeVerUsuarios">
          <i-lucide name="users" aria-hidden="true"></i-lucide>
          <span>Usuários</span>
        </a>
        <a routerLink="/configuracoes" routerLinkActive="active" *ngIf="podeVerConfiguracoes">
          <i-lucide name="settings" aria-hidden="true"></i-lucide>
          <span>Config</span>
        </a>
        <button type="button" class="icon-action" (click)="logout()" title="Sair">
          <i-lucide name="log-out" aria-hidden="true"></i-lucide>
          <span>Sair</span>
        </button>
      </nav>

      
    </header>
  `,
})
export class ImperialHeaderComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly configuracaoService = inject(ConfiguracaoService);
  caixaPodeConfigurar = false;

  ngOnInit(): void {
    if (this.auth.usuarioAtual?.perfil === 'CAIXA') {
      this.configuracaoService.obter().subscribe({
        next: (configuracao) => {
          this.caixaPodeConfigurar = configuracao.caixaPodeConfigurar;
        },
      });
    }
  }

  get podeVerAdmin(): boolean {
    return this.auth.usuarioAtual?.perfil === 'ADMIN';
  }

  get podeVerUsuarios(): boolean {
    return this.auth.usuarioAtual?.perfil === 'ADMIN';
  }

  get podeVerCaixa(): boolean {
    const perfil = this.auth.usuarioAtual?.perfil;
    return perfil === 'ADMIN' || perfil === 'CAIXA';
  }

  get podeVerProducao(): boolean {
    const perfil = this.auth.usuarioAtual?.perfil;
    return perfil === 'ADMIN' || perfil === 'PRODUCAO';
  }

  get podeVerConfiguracoes(): boolean {
    const perfil = this.auth.usuarioAtual?.perfil;
    return perfil === 'ADMIN' || (perfil === 'CAIXA' && this.caixaPodeConfigurar);
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
