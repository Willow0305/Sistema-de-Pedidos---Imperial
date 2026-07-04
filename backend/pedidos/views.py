from django.db import transaction
from django.db.models import Q
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .consumers import broadcast_event
from .models import ConfiguracaoSistema, Pedido, Produto
from .permissions import AdminCaixaOuProducao, AdminOuCaixa, ApenasAdmin, PodeAlterarConfiguracao
from .serializers import (
    AtualizarStatusSerializer,
    ConfiguracaoSistemaSerializer,
    CriarPedidoSerializer,
    LoginSerializer,
    PedidoSerializer,
    ProdutoSerializer,
    UsuarioAdminSerializer,
)


def serializar_pedido(pedido: Pedido) -> dict:
    return PedidoSerializer(pedido).data


def resumo_fichas() -> dict:
    configuracao = ConfiguracaoSistema.atual()
    ocupadas = set(
        Pedido.objects.filter(status__in=Pedido.STATUS_ATIVOS).values_list(
            "numero_ficha",
            flat=True,
        )
    )
    todas = set(range(1, configuracao.quantidade_fichas + 1))

    return {
        "quantidadeFichas": configuracao.quantidade_fichas,
        "livres": sorted(todas - ocupadas),
        "ocupadas": sorted(ocupadas),
    }


def mensagem_por_status(pedido: Pedido, configuracao: ConfiguracaoSistema) -> str:
    mensagens = {
        Pedido.PENDENTE: "Seu pedido foi recebido e está aguardando produção.",
        Pedido.EM_PRODUCAO: "Seu pedido está em produção.",
        Pedido.PRONTO: configuracao.mensagem_pedido_pronto,
        Pedido.ENTREGUE: "Seu pedido já foi entregue.",
        Pedido.CANCELADO: (
            "Este pedido foi cancelado. Procure o caixa para mais informações."
        ),
    }
    return mensagens.get(pedido.status, "")


class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        perfil = serializer.validated_data["perfil"]
        token, _ = Token.objects.get_or_create(user=user)
        nome = user.get_full_name() or user.username

        return Response(
            {
                "token": token.key,
                "usuario": {
                    "id": user.id,
                    "nome": nome,
                    "perfil": perfil.perfil,
                },
            }
        )


class UsuarioAdminAPIView(APIView):
    permission_classes = [ApenasAdmin]

    def get(self, request):
        usuarios = (
            User.objects.select_related("perfil_imperial")
            .filter(perfil_imperial__isnull=False)
            .order_by("first_name", "username")
        )
        return Response(UsuarioAdminSerializer(usuarios, many=True).data)

    def post(self, request):
        serializer = UsuarioAdminSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            UsuarioAdminSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )


class UsuarioAdminDetailAPIView(APIView):
    permission_classes = [ApenasAdmin]

    def get_object(self, usuario_id: int):
        return (
            User.objects.select_related("perfil_imperial")
            .filter(id=usuario_id, perfil_imperial__isnull=False)
            .first()
        )

    def put(self, request, usuario_id: int):
        user = self.get_object(usuario_id)
        if not user:
            return Response(
                {"detail": "Usuário não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = UsuarioAdminSerializer(user, data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user = self.get_object(user.id)
        return Response(UsuarioAdminSerializer(user).data)

    def delete(self, request, usuario_id: int):
        user = self.get_object(usuario_id)
        if not user:
            return Response(
                {"detail": "Usuário não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.id == request.user.id:
            return Response(
                {"detail": "Você não pode excluir o usuário que está logado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PublicConfiguracaoAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        configuracao = ConfiguracaoSistema.atual()
        return Response(
            {
                "nomeEstabelecimento": configuracao.nome_estabelecimento,
                "mensagemCliente": configuracao.mensagem_cliente,
                "mensagemPedidoPronto": configuracao.mensagem_pedido_pronto,
                "intervaloAtualizacaoSegundos": configuracao.intervalo_atualizacao_segundos,
            }
        )


class PublicPedidoAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, numero_ficha: int):
        configuracao = ConfiguracaoSistema.atual()
        pedidos_da_ficha = Pedido.objects.prefetch_related("itens").filter(
            numero_ficha=numero_ficha,
        )
        pedido = (
            pedidos_da_ficha.filter(status__in=Pedido.STATUS_ATIVOS)
            .order_by("-criado_em", "-id")
            .first()
        )

        if not pedido:
            pedido = pedidos_da_ficha.order_by("-criado_em", "-id").first()

        if not pedido:
            return Response(
                {
                    "numeroFicha": numero_ficha,
                    "mensagem": "Pedido não encontrado. Confira o número da ficha.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        posicao_fila = None
        pedidos_na_frente = None

        if pedido.status in Pedido.STATUS_FILA:
            pedidos_na_frente = Pedido.objects.filter(
                status__in=Pedido.STATUS_FILA,
            ).filter(
                Q(criado_em__lt=pedido.criado_em)
                | Q(criado_em=pedido.criado_em, id__lt=pedido.id)
            ).count()
            posicao_fila = pedidos_na_frente + 1

        response = {
            "numeroPedido": pedido.numero_pedido,
            "nomeCliente": pedido.nome_cliente,
            "numeroFicha": pedido.numero_ficha,
            "status": pedido.status,
            "posicaoFila": posicao_fila,
            "pedidosNaFrente": pedidos_na_frente,
            "mensagem": mensagem_por_status(pedido, configuracao),
        }

        if pedido.status == Pedido.PRONTO:
            response["destaque"] = "Pode buscar no balcão."

        return Response(response)


class PedidoAtivosAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        configuracao = ConfiguracaoSistema.atual()
        status_ativos = Pedido.STATUS_ATIVOS
        if not configuracao.exibir_pedidos_prontos_na_producao:
            status_ativos = [Pedido.PENDENTE, Pedido.EM_PRODUCAO]

        pedidos = (
            Pedido.objects.prefetch_related("itens")
            .filter(status__in=status_ativos)
            .order_by("criado_em", "id")
        )
        return Response(PedidoSerializer(pedidos, many=True).data)


class PedidoCreateAPIView(APIView):
    permission_classes = [AdminOuCaixa]

    def post(self, request):
        serializer = CriarPedidoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pedido = serializer.save()
        data = serializar_pedido(pedido)

        transaction.on_commit(
            lambda: (
                broadcast_event("pedido_criado", {"pedido": data}),
                broadcast_event("fichas_atualizadas", resumo_fichas()),
            )
        )

        return Response(data, status=status.HTTP_201_CREATED)


class PedidoStatusAPIView(APIView):
    permission_classes = [AdminCaixaOuProducao]

    def put(self, request, pedido_id: int):
        serializer = AtualizarStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        novo_status = serializer.validated_data["status"]

        with transaction.atomic():
            pedido = (
                Pedido.objects.select_for_update()
                .prefetch_related("itens")
                .filter(id=pedido_id)
                .first()
            )
            if not pedido:
                return Response(
                    {"detail": "Pedido não encontrado."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            pedido.status = novo_status
            pedido.save(update_fields=["status", "atualizado_em"])
            data = serializar_pedido(pedido)

            def enviar_eventos():
                tipo = "pedido_cancelado" if novo_status == Pedido.CANCELADO else "pedido_atualizado"
                broadcast_event(tipo, {"pedido": data})
                broadcast_event("fichas_atualizadas", resumo_fichas())

            transaction.on_commit(enviar_eventos)

        return Response(data)


class FichasAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(resumo_fichas())


class FichaDisponibilidadeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, numero: int):
        ocupada = Pedido.objects.filter(
            numero_ficha=numero,
            status__in=Pedido.STATUS_ATIVOS,
        ).exists()
        return Response({"numeroFicha": numero, "livre": not ocupada})


class ConfiguracaoAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        configuracao = ConfiguracaoSistema.atual()
        return Response(ConfiguracaoSistemaSerializer(configuracao).data)

    def put(self, request):
        permission = PodeAlterarConfiguracao()
        if not permission.has_permission(request, self):
            return Response(
                {"detail": "Você não tem permissão para alterar configurações."},
                status=status.HTTP_403_FORBIDDEN,
            )

        configuracao = ConfiguracaoSistema.atual()
        serializer = ConfiguracaoSistemaSerializer(configuracao, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ProdutoAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        produtos = Produto.objects.all()
        if request.query_params.get("ativos") == "true":
            produtos = produtos.filter(ativo=True)

        return Response(ProdutoSerializer(produtos, many=True).data)

    def post(self, request):
        permission = PodeAlterarConfiguracao()
        if not permission.has_permission(request, self):
            return Response(
                {"detail": "Você não tem permissão para alterar produtos."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ProdutoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        produto = serializer.save()
        return Response(ProdutoSerializer(produto).data, status=status.HTTP_201_CREATED)


class ProdutoDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, produto_id: int):
        return Produto.objects.filter(id=produto_id).first()

    def put(self, request, produto_id: int):
        permission = PodeAlterarConfiguracao()
        if not permission.has_permission(request, self):
            return Response(
                {"detail": "Você não tem permissão para alterar produtos."},
                status=status.HTTP_403_FORBIDDEN,
            )

        produto = self.get_object(produto_id)
        if not produto:
            return Response(
                {"detail": "Produto não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ProdutoSerializer(produto, data=request.data)
        serializer.is_valid(raise_exception=True)
        produto = serializer.save()
        return Response(ProdutoSerializer(produto).data)

    def delete(self, request, produto_id: int):
        permission = PodeAlterarConfiguracao()
        if not permission.has_permission(request, self):
            return Response(
                {"detail": "Você não tem permissão para alterar produtos."},
                status=status.HTTP_403_FORBIDDEN,
            )

        produto = self.get_object(produto_id)
        if not produto:
            return Response(
                {"detail": "Produto não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        produto.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class NomesClientesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        nomes = (
            Pedido.objects.exclude(nome_cliente="")
            .values_list("nome_cliente", flat=True)
            .distinct()
            .order_by("nome_cliente")[:100]
        )
        return Response({"nomes": list(nomes)})

