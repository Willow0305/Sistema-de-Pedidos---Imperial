import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { configAccessGuard } from './core/guards/config-access.guard';
import { roleGuard } from './core/guards/role.guard';
import { AdminComponent } from './features/admin/admin.component';
import { CaixaComponent } from './features/caixa/caixa.component';
import { ClienteComponent } from './features/cliente/cliente.component';
import { ConfiguracoesComponent } from './features/configuracoes/configuracoes.component';
import { LoginComponent } from './features/login/login.component';
import { ProducaoComponent } from './features/producao/producao.component';
import { QrcodesComponent } from './features/qrcodes/qrcodes.component';
import { UsuariosComponent } from './features/usuarios/usuarios.component';

export const routes: Routes = [
  { path: '', redirectTo: 'cliente', pathMatch: 'full' },
  { path: 'cliente', component: ClienteComponent },
  { path: 'consultar-pedido', component: ClienteComponent },
  { path: 'login', component: LoginComponent },
  { path: 'interno', component: LoginComponent },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'usuarios',
    component: UsuariosComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'caixa',
    component: CaixaComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'CAIXA'] },
  },
  {
    path: 'producao',
    component: ProducaoComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'PRODUCAO'] },
  },
  {
    path: 'configuracoes',
    component: ConfiguracoesComponent,
    canActivate: [authGuard, roleGuard, configAccessGuard],
    data: { roles: ['ADMIN', 'CAIXA'] },
  },
  {
    path: 'qrcodes',
    component: QrcodesComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'CAIXA', 'PRODUCAO'] },
  },
  { path: '**', redirectTo: 'cliente' },
];
