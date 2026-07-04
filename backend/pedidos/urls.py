from django.urls import path

from .views import (
    ConfiguracaoAPIView,
    FichaDisponibilidadeAPIView,
    FichasAPIView,
    LoginAPIView,
    NomesClientesAPIView,
    PedidoAtivosAPIView,
    PedidoCreateAPIView,
    PedidoStatusAPIView,
    ProdutoAPIView,
    ProdutoDetailAPIView,
    PublicConfiguracaoAPIView,
    PublicPedidoAPIView,
    UsuarioAdminAPIView,
    UsuarioAdminDetailAPIView,
)


urlpatterns = [
    path("auth/login/", LoginAPIView.as_view(), name="login"),
    path("usuarios/", UsuarioAdminAPIView.as_view(), name="usuarios-admin"),
    path(
        "usuarios/<int:usuario_id>/",
        UsuarioAdminDetailAPIView.as_view(),
        name="usuarios-admin-detail",
    ),
    path("publico/configuracoes/", PublicConfiguracaoAPIView.as_view(), name="public-config"),
    path(
        "publico/pedidos/<int:numero_ficha>/",
        PublicPedidoAPIView.as_view(),
        name="public-pedido",
    ),
    path("pedidos/ativos/", PedidoAtivosAPIView.as_view(), name="pedidos-ativos"),
    path("pedidos/", PedidoCreateAPIView.as_view(), name="pedidos-create"),
    path(
        "pedidos/<int:pedido_id>/status/",
        PedidoStatusAPIView.as_view(),
        name="pedido-status",
    ),
    path("fichas/", FichasAPIView.as_view(), name="fichas"),
    path(
        "fichas/<int:numero>/disponibilidade/",
        FichaDisponibilidadeAPIView.as_view(),
        name="ficha-disponibilidade",
    ),
    path("configuracoes/", ConfiguracaoAPIView.as_view(), name="configuracoes"),
    path("produtos/", ProdutoAPIView.as_view(), name="produtos"),
    path("produtos/<int:produto_id>/", ProdutoDetailAPIView.as_view(), name="produtos-detail"),
    path("clientes/nomes/", NomesClientesAPIView.as_view(), name="clientes-nomes"),
]
