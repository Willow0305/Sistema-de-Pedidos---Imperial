import { NgFor } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-ficha-selector',
  standalone: true,
  imports: [NgFor],
  template: `
    <div class="ficha-grid" role="listbox" aria-label="Selecionar ficha">
      <button
        type="button"
        class="ficha"
        *ngFor="let ficha of fichas"
        [disabled]="ocupadas.includes(ficha)"
        [class.livre]="livres.includes(ficha)"
        [class.ocupada]="ocupadas.includes(ficha)"
        [class.selecionada]="selected === ficha"
        (click)="selecionar(ficha)"
      >
        {{ ficha }}
      </button>
    </div>
  `,
})
export class FichaSelectorComponent {
  @Input() quantidadeFichas = 0;
  @Input() livres: number[] = [];
  @Input() ocupadas: number[] = [];
  @Input() selected: number | null = null;
  @Output() selectedChange = new EventEmitter<number>();

  get fichas(): number[] {
    return Array.from({ length: this.quantidadeFichas }, (_, index) => index + 1);
  }

  selecionar(ficha: number): void {
    if (this.ocupadas.includes(ficha)) {
      return;
    }

    this.selectedChange.emit(ficha);
  }
}
