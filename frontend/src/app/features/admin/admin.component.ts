import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { ImperialHeaderComponent } from '../../shared/components/imperial-header/imperial-header.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterLink, ImperialHeaderComponent, LucideAngularModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent {}
