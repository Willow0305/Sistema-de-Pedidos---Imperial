import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ConfiguracaoSistema",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "nome_estabelecimento",
                    models.CharField(default="A.A.A Imperial", max_length=120),
                ),
                ("quantidade_fichas", models.PositiveIntegerField(default=30)),
                (
                    "mensagem_cliente",
                    models.TextField(
                        default="Digite o número do seu pedido para acompanhar o andamento."
                    ),
                ),
                (
                    "mensagem_pedido_pronto",
                    models.TextField(
                        default="Seu pedido está pronto. Você já pode ir buscar."
                    ),
                ),
                ("caixa_pode_configurar", models.BooleanField(default=False)),
                ("intervalo_atualizacao_segundos", models.PositiveIntegerField(default=10)),
                ("exibir_pedidos_prontos_na_producao", models.BooleanField(default=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "configuracao do sistema",
                "verbose_name_plural": "configuracoes do sistema",
            },
        ),
        migrations.CreateModel(
            name="ContadorPedido",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("ultimo_numero", models.PositiveIntegerField(default=0)),
            ],
        ),
        migrations.CreateModel(
            name="Pedido",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("numero_pedido", models.PositiveIntegerField(db_index=True, unique=True)),
                ("nome_cliente", models.CharField(max_length=120)),
                ("numero_ficha", models.PositiveIntegerField(db_index=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pendente", "Pendente"),
                            ("em_producao", "Em produção"),
                            ("pronto", "Pronto"),
                            ("entregue", "Entregue"),
                            ("cancelado", "Cancelado"),
                        ],
                        default="pendente",
                        max_length=20,
                    ),
                ),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["criado_em", "id"],
            },
        ),
        migrations.CreateModel(
            name="ItemPedido",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("produto", models.CharField(max_length=120)),
                ("quantidade", models.PositiveIntegerField()),
                ("observacao", models.TextField(blank=True)),
                (
                    "pedido",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="itens",
                        to="pedidos.pedido",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="PerfilUsuario",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "perfil",
                    models.CharField(
                        choices=[
                            ("ADMIN", "Admin"),
                            ("CAIXA", "Caixa"),
                            ("PRODUCAO", "Producao"),
                        ],
                        max_length=20,
                    ),
                ),
                ("ativo", models.BooleanField(default=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="perfil_imperial",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]
