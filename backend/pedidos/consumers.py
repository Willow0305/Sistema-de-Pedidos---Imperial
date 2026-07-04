from urllib.parse import parse_qs

from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.layers import get_channel_layer
from rest_framework.authtoken.models import Token


PEDIDOS_GROUP = "pedidos_imperial"


class PedidosConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = await self._authenticate_token()
        if not user:
            await self.close(code=4401)
            return

        self.scope["user"] = user
        await self.channel_layer.group_add(PEDIDOS_GROUP, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(PEDIDOS_GROUP, self.channel_name)

    async def pedidos_event(self, event):
        await self.send_json(event["payload"])

    async def _authenticate_token(self):
        query_string = self.scope.get("query_string", b"").decode()
        token_key = parse_qs(query_string).get("token", [None])[0]
        if not token_key:
            return None

        return await buscar_usuario_por_token(token_key)


@database_sync_to_async
def buscar_usuario_por_token(token_key: str):
    token = Token.objects.select_related("user", "user__perfil_imperial").filter(
        key=token_key,
        user__is_active=True,
    ).first()
    if not token:
        return None

    perfil = getattr(token.user, "perfil_imperial", None)
    if not perfil or not perfil.ativo:
        return None

    return token.user


def broadcast_event(tipo: str, payload: dict) -> None:
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    async_to_sync(channel_layer.group_send)(
        PEDIDOS_GROUP,
        {
            "type": "pedidos.event",
            "payload": {
                "tipo": tipo,
                **payload,
            },
        },
    )
