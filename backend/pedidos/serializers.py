from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Max
from rest_framework import serializers

from .models import ConfiguracaoSistema, ContadorPedido, ItemPedido, Pedido, PerfilUsuario, Produto


class UsuarioSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    nome = serializers.CharField()
    perfil = serializers.CharField()


class UsuarioAdminSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(max_length=150)
    nome = serializers.CharField(max_length=150)
    perfil = serializers.ChoiceField(choices=[choice[0] for choice in PerfilUsuario.PERFIS])
    ativo = serializers.BooleanField(default=True)
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        required=False,
        allow_blank=True,
    )

    def validate_username(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Informe o usuário.")

        queryset = User.objects.filter(username__iexact=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError("Já existe um usuário com esse login.")

        return value

    def validate_nome(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Informe o nome.")
        return value

    def create(self, validated_data):
        perfil = validated_data.pop("perfil")
        ativo = validated_data.pop("ativo", True)
        password = validated_data.pop("password", "")
        nome = validated_data.pop("nome")

        if not password:
            raise serializers.ValidationError({"password": "Informe uma senha."})

        user = User.objects.create_user(
            username=validated_data["username"],
            password=password,
            first_name=nome,
            is_active=ativo,
            is_staff=perfil == PerfilUsuario.ADMIN,
            is_superuser=False,
        )
        PerfilUsuario.objects.create(user=user, perfil=perfil, ativo=ativo)
        return user

    def update(self, instance: User, validated_data):
        perfil = validated_data.pop("perfil")
        ativo = validated_data.pop("ativo", True)
        password = validated_data.pop("password", "")
        nome = validated_data.pop("nome")

        instance.username = validated_data["username"]
        instance.first_name = nome
        instance.is_active = ativo
        instance.is_staff = perfil == PerfilUsuario.ADMIN
        if password:
            instance.set_password(password)
        instance.save()

        PerfilUsuario.objects.update_or_create(
            user=instance,
            defaults={"perfil": perfil, "ativo": ativo},
        )
        return instance

    def to_representation(self, instance: User):
        perfil = obter_perfil_usuario(instance)
        return {
            "id": instance.id,
            "username": instance.username,
            "nome": instance.get_full_name() or instance.username,
            "perfil": perfil.perfil if perfil else "",
            "ativo": bool(perfil.ativo if perfil else instance.is_active),
        }


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        user = authenticate(
            username=attrs.get("username"),
            password=attrs.get("password"),
        )
        if not user:
            raise serializers.ValidationError("Usuário ou senha inválido.")

        perfil = obter_perfil_usuario(user)
        if not perfil or not perfil.ativo:
            raise serializers.ValidationError("Usuário sem perfil ativo no sistema.")

        attrs["user"] = user
        attrs["perfil"] = perfil
        return attrs


def obter_perfil_usuario(user: User) -> PerfilUsuario | None:
    if getattr(user, "is_superuser", False):
        perfil, _ = PerfilUsuario.objects.get_or_create(
            user=user,
            defaults={"perfil": PerfilUsuario.ADMIN, "ativo": True},
        )
        return perfil

    return getattr(user, "perfil_imperial", None)


class ItemPedidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemPedido
        fields = ["id", "produto", "quantidade", "observacao"]
        read_only_fields = ["id"]

    def validate_produto(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Informe o produto.")
        return value

    def validate_quantidade(self, value: int) -> int:
        if value <= 0:
            raise serializers.ValidationError("A quantidade deve ser maior que zero.")
        return value


class PedidoSerializer(serializers.ModelSerializer):
    numeroPedido = serializers.IntegerField(source="numero_pedido", read_only=True)
    nomeCliente = serializers.CharField(source="nome_cliente", read_only=True)
    numeroFicha = serializers.IntegerField(source="numero_ficha", read_only=True)
    criadoEm = serializers.DateTimeField(source="criado_em", read_only=True)
    atualizadoEm = serializers.DateTimeField(source="atualizado_em", read_only=True)
    itens = ItemPedidoSerializer(many=True, read_only=True)

    class Meta:
        model = Pedido
        fields = [
            "id",
            "numeroPedido",
            "nomeCliente",
            "numeroFicha",
            "status",
            "criadoEm",
            "atualizadoEm",
            "itens",
        ]


class CriarPedidoSerializer(serializers.Serializer):
    nomeCliente = serializers.CharField(max_length=120)
    numeroFicha = serializers.IntegerField(min_value=1)
    itens = ItemPedidoSerializer(many=True)

    def validate_nomeCliente(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Informe o nome do cliente.")
        return value

    def validate(self, attrs):
        configuracao = ConfiguracaoSistema.atual()
        numero_ficha = attrs["numeroFicha"]

        if numero_ficha > configuracao.quantidade_fichas:
            raise serializers.ValidationError(
                {
                    "numeroFicha": (
                        f"A ficha {numero_ficha} está fora do limite configurado "
                        f"de {configuracao.quantidade_fichas} fichas."
                    )
                }
            )

        if not attrs.get("itens"):
            raise serializers.ValidationError({"itens": "Adicione pelo menos um item."})

        return attrs

    def create(self, validated_data):
        itens_data = validated_data.pop("itens")
        nome_cliente = validated_data["nomeCliente"]
        numero_ficha = validated_data["numeroFicha"]

        with transaction.atomic():
            ficha_ocupada = (
                Pedido.objects.select_for_update()
                .filter(numero_ficha=numero_ficha, status__in=Pedido.STATUS_ATIVOS)
                .exists()
            )
            if ficha_ocupada:
                raise serializers.ValidationError(
                    {"numeroFicha": "Esta ficha já está ocupada."}
                )

            numero_pedido = ContadorPedido.proximo_numero()
            pedido = Pedido.objects.create(
                numero_pedido=numero_pedido,
                nome_cliente=nome_cliente,
                numero_ficha=numero_ficha,
                status=Pedido.PENDENTE,
            )

            ItemPedido.objects.bulk_create(
                [
                    ItemPedido(
                        pedido=pedido,
                        produto=item["produto"],
                        quantidade=item["quantidade"],
                        observacao=item.get("observacao", ""),
                    )
                    for item in itens_data
                ]
            )

        return pedido


class AtualizarStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[choice[0] for choice in Pedido.STATUS_CHOICES])


class ProdutoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Produto
        fields = ["id", "nome", "ativo"]

    def validate_nome(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Informe o nome do produto.")

        queryset = Produto.objects.filter(nome__iexact=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError("Já existe um produto com esse nome.")

        return value


class ConfiguracaoSistemaSerializer(serializers.ModelSerializer):
    nomeEstabelecimento = serializers.CharField(source="nome_estabelecimento")
    quantidadeFichas = serializers.IntegerField(source="quantidade_fichas", min_value=1)
    mensagemCliente = serializers.CharField(source="mensagem_cliente")
    mensagemPedidoPronto = serializers.CharField(source="mensagem_pedido_pronto")
    caixaPodeConfigurar = serializers.BooleanField(source="caixa_pode_configurar")
    intervaloAtualizacaoSegundos = serializers.IntegerField(
        source="intervalo_atualizacao_segundos",
        min_value=1,
        max_value=300,
    )
    exibirPedidosProntosNaProducao = serializers.BooleanField(
        source="exibir_pedidos_prontos_na_producao"
    )

    class Meta:
        model = ConfiguracaoSistema
        fields = [
            "nomeEstabelecimento",
            "quantidadeFichas",
            "mensagemCliente",
            "mensagemPedidoPronto",
            "caixaPodeConfigurar",
            "intervaloAtualizacaoSegundos",
            "exibirPedidosProntosNaProducao",
        ]

    def validate_nomeEstabelecimento(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Informe o nome do estabelecimento.")
        return value

    def validate_mensagemCliente(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Informe a mensagem da tela do cliente.")
        return value

    def validate_mensagemPedidoPronto(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Informe a mensagem de pedido pronto.")
        return value

    def validate_quantidadeFichas(self, value: int) -> int:
        if value > 999:
            raise serializers.ValidationError("Use no máximo 999 fichas.")
        return value

    def validate(self, attrs):
        quantidade = attrs.get(
            "quantidade_fichas",
            getattr(self.instance, "quantidade_fichas", None),
        )
        maior_ficha_ocupada = Pedido.objects.filter(
            status__in=Pedido.STATUS_ATIVOS
        ).aggregate(maior=Max("numero_ficha"))["maior"]

        if maior_ficha_ocupada and quantidade < maior_ficha_ocupada:
            raise serializers.ValidationError(
                {
                    "quantidadeFichas": (
                        f"Não é possível reduzir para {quantidade} fichas porque "
                        "existem pedidos ativos usando fichas acima desse número."
                    )
                }
            )

        return attrs
