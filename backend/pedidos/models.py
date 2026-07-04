from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models, transaction


class PerfilUsuario(models.Model):
    ADMIN = "ADMIN"
    CAIXA = "CAIXA"
    PRODUCAO = "PRODUCAO"

    PERFIS = [
        (ADMIN, "Admin"),
        (CAIXA, "Caixa"),
        (PRODUCAO, "Producao"),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="perfil_imperial",
    )
    perfil = models.CharField(max_length=20, choices=PERFIS)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.user.username} - {self.perfil}"


class ConfiguracaoSistema(models.Model):
    nome_estabelecimento = models.CharField(
        max_length=120,
        default="A.A.A Imperial",
    )
    quantidade_fichas = models.PositiveIntegerField(default=30)
    mensagem_cliente = models.TextField(
        default="Digite o número do seu pedido para acompanhar o andamento."
    )
    mensagem_pedido_pronto = models.TextField(
        default="Seu pedido está pronto. Você já pode ir buscar."
    )
    caixa_pode_configurar = models.BooleanField(default=False)
    intervalo_atualizacao_segundos = models.PositiveIntegerField(default=10)
    exibir_pedidos_prontos_na_producao = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "configuracao do sistema"
        verbose_name_plural = "configuracoes do sistema"

    def __str__(self) -> str:
        return self.nome_estabelecimento

    @classmethod
    def atual(cls):
        configuracao, _ = cls.objects.get_or_create(pk=1)
        return configuracao

    def clean(self):
        if self.quantidade_fichas < 1:
            raise ValidationError({"quantidade_fichas": "Informe pelo menos uma ficha."})

        maior_ficha_ocupada = (
            Pedido.objects.filter(status__in=Pedido.STATUS_ATIVOS)
            .order_by("-numero_ficha")
            .values_list("numero_ficha", flat=True)
            .first()
        )

        if maior_ficha_ocupada and self.quantidade_fichas < maior_ficha_ocupada:
            raise ValidationError(
                {
                    "quantidade_fichas": (
                        f"Não é possível reduzir para {self.quantidade_fichas} fichas "
                        "porque existem pedidos ativos usando fichas acima desse número."
                    )
                }
            )

    def save(self, *args, **kwargs):
        self.pk = 1
        self.full_clean()
        super().save(*args, **kwargs)


class Pedido(models.Model):
    PENDENTE = "pendente"
    EM_PRODUCAO = "em_producao"
    PRONTO = "pronto"
    ENTREGUE = "entregue"
    CANCELADO = "cancelado"

    STATUS_ATIVOS = [PENDENTE, EM_PRODUCAO, PRONTO]
    STATUS_FILA = [PENDENTE, EM_PRODUCAO]

    STATUS_CHOICES = [
        (PENDENTE, "Pendente"),
        (EM_PRODUCAO, "Em produção"),
        (PRONTO, "Pronto"),
        (ENTREGUE, "Entregue"),
        (CANCELADO, "Cancelado"),
    ]

    numero_pedido = models.PositiveIntegerField(unique=True, db_index=True)
    nome_cliente = models.CharField(max_length=120)
    numero_ficha = models.PositiveIntegerField(db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDENTE)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["criado_em", "id"]

    def __str__(self) -> str:
        return f"Pedido {self.numero_pedido} - ficha {self.numero_ficha}"


class ItemPedido(models.Model):
    pedido = models.ForeignKey(
        Pedido,
        on_delete=models.CASCADE,
        related_name="itens",
    )
    produto = models.CharField(max_length=120)
    quantidade = models.PositiveIntegerField()
    observacao = models.TextField(blank=True)

    def __str__(self) -> str:
        return f"{self.quantidade}x {self.produto}"


class Produto(models.Model):
    nome = models.CharField(max_length=120, unique=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["nome"]

    def __str__(self) -> str:
        return self.nome


class ContadorPedido(models.Model):
    ultimo_numero = models.PositiveIntegerField(default=0)

    @classmethod
    def proximo_numero(cls) -> int:
        with transaction.atomic():
            contador, _ = cls.objects.select_for_update().get_or_create(pk=1)
            contador.ultimo_numero += 1
            contador.save(update_fields=["ultimo_numero"])
            return contador.ultimo_numero

    def __str__(self) -> str:
        return f"Último pedido: {self.ultimo_numero}"
