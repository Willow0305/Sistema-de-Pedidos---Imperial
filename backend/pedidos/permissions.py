from rest_framework.permissions import BasePermission

from .models import ConfiguracaoSistema, PerfilUsuario
from .serializers import obter_perfil_usuario


def perfil_do_usuario(user):
    if not user or not user.is_authenticated:
        return None

    perfil = obter_perfil_usuario(user)
    if not perfil or not perfil.ativo:
        return None

    return perfil.perfil


class TemPerfil(BasePermission):
    perfis = []

    def has_permission(self, request, view):
        perfil = perfil_do_usuario(request.user)
        return perfil in self.perfis


class AdminOuCaixa(TemPerfil):
    perfis = [PerfilUsuario.ADMIN, PerfilUsuario.CAIXA]


class ApenasAdmin(TemPerfil):
    perfis = [PerfilUsuario.ADMIN]


class AdminCaixaOuProducao(TemPerfil):
    perfis = [PerfilUsuario.ADMIN, PerfilUsuario.CAIXA, PerfilUsuario.PRODUCAO]


class PodeAlterarConfiguracao(BasePermission):
    def has_permission(self, request, view):
        perfil = perfil_do_usuario(request.user)
        if perfil == PerfilUsuario.ADMIN:
            return True

        if perfil == PerfilUsuario.CAIXA:
            return ConfiguracaoSistema.atual().caixa_pode_configurar

        return False
