import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { PerfilUsuario } from '../../shared/models/usuario.model';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = (route.data['roles'] ?? []) as PerfilUsuario[];

  if (auth.hasRole(roles)) {
    return true;
  }

  return router.createUrlTree([auth.rotaInicial()]);
};
