from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError

from pedidos.models import PerfilUsuario


class Command(BaseCommand):
    help = "Cria ou atualiza o primeiro usuario ADMIN do Sistema de Pedidos Imperial."

    def add_arguments(self, parser):
        parser.add_argument("--username", default="admin")
        parser.add_argument("--password", required=True)
        parser.add_argument("--nome", default="Administrador Imperial")

    def handle(self, *args, **options):
        username = options["username"]
        password = options["password"]
        nome = options["nome"]

        if len(password) < 8:
            raise CommandError("Use uma senha com pelo menos 8 caracteres.")

        user, created = User.objects.get_or_create(username=username)
        user.set_password(password)
        user.first_name = nome
        user.is_staff = True
        user.is_superuser = True
        user.save()

        PerfilUsuario.objects.update_or_create(
            user=user,
            defaults={"perfil": PerfilUsuario.ADMIN, "ativo": True},
        )

        action = "criado" if created else "atualizado"
        self.stdout.write(self.style.SUCCESS(f"Usuário ADMIN {action}: {username}"))
