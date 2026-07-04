import { NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';

import { FichaService } from '../../core/services/ficha.service';
import { PedidoService } from '../../core/services/pedido.service';
import { ProdutoService } from '../../core/services/produto.service';
import { WebsocketService } from '../../core/services/websocket.service';
import { FichaSelectorComponent } from '../../shared/components/ficha-selector/ficha-selector.component';
import { ImperialHeaderComponent } from '../../shared/components/imperial-header/imperial-header.component';
import { FichasResumo } from '../../shared/models/ficha.model';
import { Pedido } from '../../shared/models/pedido.model';
import { Produto } from '../../shared/models/produto.model';

@Component({
  selector: 'app-caixa',
  standalone: true,
  imports: [
    FichaSelectorComponent,
    ImperialHeaderComponent,
    LucideAngularModule,
    NgFor,
    NgIf,
    ReactiveFormsModule,
  ],
  templateUrl: './caixa.component.html',
  styleUrl: './caixa.component.scss',
})
export class CaixaComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly fichaService = inject(FichaService);
  private readonly pedidoService = inject(PedidoService);
  private readonly produtoService = inject(ProdutoService);
  private readonly websocketService = inject(WebsocketService);
  private readonly subscriptions = new Subscription();

  readonly form = this.fb.group({
    nomeCliente: ['', Validators.required],
    numeroFicha: [null as number | null, Validators.required],
    itens: this.fb.array([this.novoItemForm()]),
  });

  fichas: FichasResumo = { quantidadeFichas: 0, livres: [], ocupadas: [] };
  produtos: Produto[] = [];
  nomesClientes: string[] = [];
  ultimoPedido?: Pedido;
  erro = '';
  sucesso = '';
  enviando = false;

  get itens(): FormArray {
    return this.form.get('itens') as FormArray;
  }

  get fichaSelecionada(): number | null {
    return this.form.controls.numeroFicha.value;
  }

  ngOnInit(): void {
    this.carregarFichas();
    this.carregarProdutos();
    this.carregarNomes();
    this.websocketService.connect();

    this.subscriptions.add(
      this.websocketService.eventos$.subscribe((evento) => {
        if (evento.tipo === 'fichas_atualizadas') {
          this.fichas = {
            quantidadeFichas: evento.quantidadeFichas ?? this.fichas.quantidadeFichas,
            livres: evento.livres ?? [],
            ocupadas: evento.ocupadas ?? [],
          };
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.websocketService.disconnect();
  }

  selecionarFicha(numeroFicha: number): void {
    this.form.patchValue({ numeroFicha });
  }

  adicionarItem(): void {
    this.itens.push(this.novoItemForm());
  }

  removerItem(index: number): void {
    if (this.itens.length === 1) {
      this.itens.at(0).reset({ produto: '', quantidade: 1, observacao: '' });
      return;
    }

    this.itens.removeAt(index);
  }

  criarPedido(): void {
    this.erro = '';
    this.sucesso = '';
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.erro = 'Revise nome, ficha e itens antes de criar o pedido.';
      return;
    }

    const value = this.form.getRawValue();
    const payload = {
      nomeCliente: value.nomeCliente?.trim() ?? '',
      numeroFicha: Number(value.numeroFicha),
      itens: value.itens.map((item) => ({
        produto: item.produto?.trim() ?? '',
        quantidade: Number(item.quantidade),
        observacao: item.observacao?.trim() ?? '',
      })),
    };

    this.enviando = true;
    this.pedidoService
      .criar(payload)
      .pipe(finalize(() => (this.enviando = false)))
      .subscribe({
        next: (pedido) => {
          this.ultimoPedido = pedido;
          this.sucesso = `Pedido #${pedido.numeroPedido} criado.`;
          this.salvarNomeCliente(payload.nomeCliente);
          this.limparFormulario();
          this.carregarFichas();
        },
        error: (error) => {
          this.erro =
            error?.error?.numeroFicha ||
            error?.error?.detail ||
            'Não foi possível criar o pedido.';
        },
      });
  }

  limparFormulario(): void {
    this.form.reset({ nomeCliente: '', numeroFicha: null });
    this.itens.clear();
    this.itens.push(this.novoItemForm());
  }

  private novoItemForm() {
    return this.fb.group({
      produto: ['', Validators.required],
      quantidade: [1, [Validators.required, Validators.min(1)]],
      observacao: [''],
    });
  }

  private carregarFichas(): void {
    this.fichaService.listar().subscribe({
      next: (fichas) => {
        this.fichas = fichas;
      },
    });
  }

  private carregarProdutos(): void {
    this.produtoService.listar(true).subscribe({
      next: (produtos) => {
        this.produtos = produtos;
      },
      error: () => {
        this.erro = 'Não foi possível carregar os produtos ativos.';
      },
    });
  }

  private carregarNomes(): void {
    const nomesLocais = this.lerNomesLocais();
    this.nomesClientes = nomesLocais;

    this.pedidoService.nomesClientes().subscribe({
      next: ({ nomes }) => {
        this.nomesClientes = Array.from(new Set([...nomesLocais, ...nomes])).sort();
      },
    });
  }

  private salvarNomeCliente(nome: string): void {
    if (!nome) {
      return;
    }

    const nomes = Array.from(new Set([nome, ...this.lerNomesLocais()])).slice(0, 80);
    localStorage.setItem('imperial_nomes_clientes', JSON.stringify(nomes));
    this.nomesClientes = Array.from(new Set([...this.nomesClientes, nome])).sort();
  }

  private lerNomesLocais(): string[] {
    try {
      return JSON.parse(localStorage.getItem('imperial_nomes_clientes') || '[]') as string[];
    } catch {
      return [];
    }
  }
}
