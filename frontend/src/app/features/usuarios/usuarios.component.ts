import { NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { finalize } from 'rxjs';

import { UsuarioService } from '../../core/services/usuario.service';
import { ImperialHeaderComponent } from '../../shared/components/imperial-header/imperial-header.component';
import { PerfilUsuario, Usuario } from '../../shared/models/usuario.model';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    ImperialHeaderComponent,
    LucideAngularModule,
    NgFor,
    NgIf,
    ReactiveFormsModule,
  ],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss',
})
export class UsuariosComponent {
  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);

  readonly perfis: PerfilUsuario[] = ['ADMIN', 'CAIXA', 'PRODUCAO'];
  usuarios: Usuario[] = [];
  carregando = true;
  salvando = false;
  editandoId: number | null = null;
  senhaVisivel = false;
  erro = '';
  sucesso = '';

  readonly form = this.fb.group({
    nome: ['', Validators.required],
    username: ['', Validators.required],
    password: [''],
    confirmPassword: [''],
    perfil: ['CAIXA' as PerfilUsuario, Validators.required],
    ativo: [true],
  });

  constructor() {
    this.carregarUsuarios();
  }

  get editando(): boolean {
    return this.editandoId !== null;
  }

  salvar(): void {
    this.erro = '';
    this.sucesso = '';
    this.form.markAllAsTouched();

    const password = this.form.controls.password.value ?? '';
    const confirmPassword = this.form.controls.confirmPassword.value ?? '';

    if (this.form.invalid) {
      this.erro = 'Informe nome, login e perfil.';
      return;
    }

    if (!this.editando && password.length < 8) {
      this.erro = 'Informe uma senha com pelo menos 8 caracteres.';
      return;
    }

    if (this.editando && password && password.length < 8) {
      this.erro = 'A nova senha precisa ter pelo menos 8 caracteres.';
      return;
    }

    if ((password || confirmPassword) && password !== confirmPassword) {
      this.erro = 'A senha e a confirmação precisam ser iguais.';
      return;
    }

    const value = this.form.getRawValue();
    this.salvando = true;

    const payload = {
      nome: value.nome?.trim() ?? '',
      username: value.username?.trim() ?? '',
      perfil: value.perfil ?? 'CAIXA',
      ativo: Boolean(value.ativo),
      ...(password ? { password } : {}),
    };

    const request = this.editandoId
      ? this.usuarioService.atualizar(this.editandoId, payload)
      : this.usuarioService.criar({ ...payload, password });

    request.pipe(finalize(() => (this.salvando = false))).subscribe({
      next: (usuario) => {
        this.sincronizarUsuario(usuario);
        this.sucesso = this.editando
          ? `Usuário ${usuario.username} atualizado.`
          : `Usuário ${usuario.username} criado.`;
        this.limpar();
      },
      error: (error) => {
        const data = error?.error ?? {};
        this.erro =
          data.username?.[0] ||
          data.password?.[0] ||
          data.nome?.[0] ||
          data.detail ||
          'Não foi possível salvar o usuário.';
      },
    });
  }

  editar(usuario: Usuario): void {
    this.erro = '';
    this.sucesso = '';
    this.editandoId = usuario.id;
    this.form.patchValue({
      nome: usuario.nome,
      username: usuario.username ?? '',
      password: '',
      confirmPassword: '',
      perfil: usuario.perfil,
      ativo: usuario.ativo !== false,
    });
  }

  excluir(usuario: Usuario): void {
    const confirmar = window.confirm(`Excluir o usuário ${usuario.username}?`);
    if (!confirmar) {
      return;
    }

    this.erro = '';
    this.sucesso = '';
    this.usuarioService.excluir(usuario.id).subscribe({
      next: () => {
        this.usuarios = this.usuarios.filter((item) => item.id !== usuario.id);
        if (this.editandoId === usuario.id) {
          this.limpar();
        }
        this.sucesso = `Usuário ${usuario.username} excluído.`;
      },
      error: (error) => {
        this.erro = error?.error?.detail || 'Não foi possível excluir o usuário.';
      },
    });
  }

  limpar(): void {
    this.editandoId = null;
    this.senhaVisivel = false;
    this.form.reset({
      nome: '',
      username: '',
      password: '',
      confirmPassword: '',
      perfil: 'CAIXA',
      ativo: true,
    });
  }

  alternarSenhaVisivel(): void {
    this.senhaVisivel = !this.senhaVisivel;
  }

  private carregarUsuarios(): void {
    this.usuarioService
      .listar()
      .pipe(finalize(() => (this.carregando = false)))
      .subscribe({
        next: (usuarios) => {
          this.usuarios = usuarios;
        },
        error: () => {
          this.erro = 'Não foi possível carregar os usuários.';
        },
      });
  }

  private sincronizarUsuario(usuario: Usuario): void {
    const index = this.usuarios.findIndex((item) => item.id === usuario.id);
    if (index >= 0) {
      this.usuarios[index] = usuario;
      this.usuarios = [...this.usuarios];
    } else {
      this.usuarios = [...this.usuarios, usuario];
    }

    this.usuarios = [...this.usuarios].sort((a, b) => a.nome.localeCompare(b.nome));
  }

}
