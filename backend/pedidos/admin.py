from django.contrib import admin

from .models import ConfiguracaoSistema, ContadorPedido, ItemPedido, Pedido, PerfilUsuario, Produto


class ItemPedidoInline(admin.TabularInline):
    model = ItemPedido
    extra = 0


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = (
        "numero_pedido",
        "nome_cliente",
        "numero_ficha",
        "status",
        "criado_em",
    )
    list_filter = ("status", "criado_em")
    search_fields = ("numero_pedido", "nome_cliente", "numero_ficha")
    inlines = [ItemPedidoInline]


@admin.register(PerfilUsuario)
class PerfilUsuarioAdmin(admin.ModelAdmin):
    list_display = ("user", "perfil", "ativo")
    list_filter = ("perfil", "ativo")
    search_fields = ("user__username", "user__first_name", "user__last_name")


@admin.register(ConfiguracaoSistema)
class ConfiguracaoSistemaAdmin(admin.ModelAdmin):
    list_display = (
        "nome_estabelecimento",
        "quantidade_fichas",
        "caixa_pode_configurar",
        "intervalo_atualizacao_segundos",
    )


@admin.register(ContadorPedido)
class ContadorPedidoAdmin(admin.ModelAdmin):
    list_display = ("ultimo_numero",)


@admin.register(Produto)
class ProdutoAdmin(admin.ModelAdmin):
    list_display = ("nome", "ativo", "atualizado_em")
    list_filter = ("ativo",)
    search_fields = ("nome",)
