from django.urls import re_path

from .consumers import PedidosConsumer


websocket_urlpatterns = [
    re_path(r"^ws/pedidos/$", PedidosConsumer.as_asgi()),
]
