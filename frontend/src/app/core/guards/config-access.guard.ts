import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { ConfiguracaoService } from '../services/configuracao.service';

export const configAccessGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const usuario = auth.usuarioAtual;

  if (usuario?.perfil === 'ADMIN') {
    return true;
  }

  if (usuario?.perfil !== 'CAIXA') {
    return router.createUrlTree([auth.rotaInicial()]);
  }

  return inject(ConfiguracaoService)
    .obter()
    .pipe(
      map((configuracao) =>
        configuracao.caixaPodeConfigurar
          ? true
          : router.createUrlTree([auth.rotaInicial()]),
      ),
      catchError(() => of(router.createUrlTree([auth.rotaInicial()]))),
    );
};
