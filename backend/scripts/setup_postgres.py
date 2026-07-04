import os

import psycopg
from psycopg import sql


def main() -> None:
    admin_user = os.getenv("POSTGRES_ADMIN_USER", "postgres")
    admin_password = os.getenv("POSTGRES_ADMIN_PASSWORD", "root")
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = os.getenv("POSTGRES_PORT", "5432")

    db_name = os.getenv("POSTGRES_DB", "imperial")
    app_user = os.getenv("POSTGRES_USER", "djangodb")
    app_password = os.getenv("POSTGRES_PASSWORD", "root")

    conn = psycopg.connect(
        dbname="postgres",
        user=admin_user,
        password=admin_password,
        host=host,
        port=port,
        connect_timeout=5,
        autocommit=True,
    )

    with conn.cursor() as cursor:
        cursor.execute("SELECT 1 FROM pg_roles WHERE rolname = %s", (app_user,))
        password_literal = sql.Literal(app_password)
        user_identifier = sql.Identifier(app_user)
        db_identifier = sql.Identifier(db_name)

        if cursor.fetchone():
            cursor.execute(
                sql.SQL("ALTER ROLE {} WITH LOGIN PASSWORD {}").format(
                    user_identifier,
                    password_literal,
                )
            )
        else:
            cursor.execute(
                sql.SQL("CREATE ROLE {} LOGIN PASSWORD {}").format(
                    user_identifier,
                    password_literal,
                )
            )

        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
        if cursor.fetchone():
            cursor.execute(
                sql.SQL("ALTER DATABASE {} OWNER TO {}").format(
                    db_identifier,
                    user_identifier,
                )
            )
        else:
            cursor.execute(
                sql.SQL("CREATE DATABASE {} OWNER {}").format(
                    db_identifier,
                    user_identifier,
                )
            )

    conn.close()
    print(f"PostgreSQL OK: banco '{db_name}' e usuario '{app_user}' prontos.")


if __name__ == "__main__":
    main()
