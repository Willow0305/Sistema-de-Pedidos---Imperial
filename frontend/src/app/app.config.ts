import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import {
  Check,
  ChefHat,
  ClipboardList,
  Download,
  Eye,
  EyeOff,
  Home,
  LogOut,
  LUCIDE_ICONS,
  LucideIconProvider,
  PackageCheck,
  Pencil,
  Play,
  Plus,
  Printer,
  QrCode,
  RotateCcw,
  Save,
  Settings,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-angular';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

const lucideIcons = {
  Check,
  ChefHat,
  ClipboardList,
  Download,
  Eye,
  EyeOff,
  Home,
  LogOut,
  PackageCheck,
  Pencil,
  Play,
  Plus,
  Printer,
  QrCode,
  RotateCcw,
  Save,
  Settings,
  Trash2,
  UserPlus,
  Users,
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider(lucideIcons),
    },
  ],
};
