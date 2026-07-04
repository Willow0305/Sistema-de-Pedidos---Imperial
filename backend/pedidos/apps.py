from django.apps import AppConfig
from django.db.models.signals import post_migrate


def criar_dados_padrao(sender, **kwargs):
    from .models import ConfiguracaoSistema, ContadorPedido

    ConfiguracaoSistema.objects.get_or_create(pk=1)
    ContadorPedido.objects.get_or_create(pk=1)


class PedidosConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "pedidos"

    def ready(self):
        post_migrate.connect(criar_dados_padrao, sender=self)
