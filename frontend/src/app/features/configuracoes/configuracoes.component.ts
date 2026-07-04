import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { finalize } from 'rxjs';

import { ConfiguracaoService } from '../../core/services/configuracao.service';
import { ProdutoService } from '../../core/services/produto.service';
import { ImperialHeaderComponent } from '../../shared/components/imperial-header/imperial-header.component';
import { ConfiguracaoSistema } from '../../shared/models/configuracao.model';
import { Produto } from '../../shared/models/produto.model';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [
    ImperialHeaderComponent,
    LucideAngularModule,
    NgFor,
    NgIf,
    ReactiveFormsModule,
  ],
  templateUrl: './configuracoes.component.html',
  styleUrl: './configuracoes.component.scss',
})
export class ConfiguracoesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly configuracaoService = inject(ConfiguracaoService);
  private readonly produtoService = inject(ProdutoService);

  readonly form = this.fb.group({
    nomeEstabelecimento: ['', Validators.required],
    quantidadeFichas: [30, [Validators.required, Validators.min(1), Validators.max(999)]],
    mensagemCliente: ['', Validators.required],
    mensagemPedidoPronto: ['', Validators.required],
    caixaPodeConfigurar: [false],
    intervaloAtualizacaoSegundos: [10, [Validators.required, Validators.min(1)]],
    exibirPedidosProntosNaProducao: [true],
  });

  readonly produtoForm = this.fb.group({
    nome: ['', Validators.required],
    ativo: [true],
  });

  carregando = true;
  salvando = false;
  salvandoProduto = false;
  editandoProdutoId: number | null = null;
  produtos: Produto[] = [];
  erro = '';
  sucesso = '';
  erroProduto = '';
  sucessoProduto = '';

  ngOnInit(): void {
    this.configuracaoService.obter().subscribe({
      next: (configuracao) => {
        this.form.patchValue(configuracao);
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Não foi possível carregar as configurações.';
        this.carregando = false;
      },
    });
    this.carregarProdutos();
  }

  salvar(): void {
    this.erro = '';
    this.sucesso = '';
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.erro = 'Revise os campos destacados.';
      return;
    }

    const value = this.form.getRawValue();
    const payload: ConfiguracaoSistema = {
      nomeEstabelecimento: value.nomeEstabelecimento ?? '',
      quantidadeFichas: Number(value.quantidadeFichas),
      mensagemCliente: value.mensagemCliente ?? '',
      mensagemPedidoPronto: value.mensagemPedidoPronto ?? '',
      caixaPodeConfigurar: Boolean(value.caixaPodeConfigurar),
      intervaloAtualizacaoSegundos: Number(value.intervaloAtualizacaoSegundos),
      exibirPedidosProntosNaProducao: Boolean(value.exibirPedidosProntosNaProducao),
    };

    this.salvando = true;
    this.configuracaoService
      .salvar(payload)
      .pipe(finalize(() => (this.salvando = false)))
      .subscribe({
        next: (configuracao) => {
          this.form.patchValue(configuracao);
          this.sucesso = 'Configurações salvas.';
        },
        error: (error) => {
          this.erro =
            error?.error?.quantidadeFichas ||
            error?.error?.detail ||
            'Não foi possível salvar as configurações.';
        },
      });
  }

  get editandoProduto(): boolean {
    return this.editandoProdutoId !== null;
  }

  salvarProduto(): void {
    this.erroProduto = '';
    this.sucessoProduto = '';
    this.produtoForm.markAllAsTouched();

    if (this.produtoForm.invalid) {
      this.erroProduto = 'Informe o nome do produto.';
      return;
    }

    const value = this.produtoForm.getRawValue();
    const payload = {
      nome: value.nome?.trim() ?? '',
      ativo: Boolean(value.ativo),
    };

    this.salvandoProduto = true;
    const request = this.editandoProdutoId
      ? this.produtoService.atualizar(this.editandoProdutoId, payload)
      : this.produtoService.criar(payload);

    request.pipe(finalize(() => (this.salvandoProduto = false))).subscribe({
      next: (produto) => {
        this.sincronizarProduto(produto);
        this.sucessoProduto = this.editandoProduto
          ? 'Produto atualizado.'
          : 'Produto adicionado.';
        this.limparProduto();
      },
      error: (error) => {
        this.erroProduto =
          error?.error?.nome?.[0] ||
          error?.error?.detail ||
          'Não foi possível salvar o produto.';
      },
    });
  }

  editarProduto(produto: Produto): void {
    this.erroProduto = '';
    this.sucessoProduto = '';
    this.editandoProdutoId = produto.id;
    this.produtoForm.patchValue({
      nome: produto.nome,
      ativo: produto.ativo,
    });
  }

  excluirProduto(produto: Produto): void {
    if (!window.confirm(`Excluir o produto ${produto.nome}?`)) {
      return;
    }

    this.produtoService.excluir(produto.id).subscribe({
      next: () => {
        this.produtos = this.produtos.filter((item) => item.id !== produto.id);
        if (this.editandoProdutoId === produto.id) {
          this.limparProduto();
        }
        this.sucessoProduto = 'Produto excluído.';
      },
      error: (error) => {
        this.erroProduto = error?.error?.detail || 'Não foi possível excluir o produto.';
      },
    });
  }

  limparProduto(): void {
    this.editandoProdutoId = null;
    this.produtoForm.reset({
      nome: '',
      ativo: true,
    });
  }

  private carregarProdutos(): void {
    this.produtoService.listar().subscribe({
      next: (produtos) => {
        this.produtos = produtos;
      },
      error: () => {
        this.erroProduto = 'Não foi possível carregar os produtos.';
      },
    });
  }

  private sincronizarProduto(produto: Produto): void {
    const index = this.produtos.findIndex((item) => item.id === produto.id);
    if (index >= 0) {
      this.produtos[index] = produto;
      this.produtos = [...this.produtos];
    } else {
      this.produtos = [...this.produtos, produto];
    }

    this.produtos = [...this.produtos].sort((a, b) => a.nome.localeCompare(b.nome));
  }
}
