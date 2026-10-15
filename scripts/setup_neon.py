"""
KLYRO — Neon PostgreSQL Remote Setup & Seeding Script
Applies all database migrations and seeds initial demonstration data into a Neon PostgreSQL database.

Usage:
    python scripts/setup_neon.py "postgres://user:pass@ep-xyz.neon.tech/neondb?sslmode=require"

Or set the environment variable first:
    $env:DATABASE_URL="postgres://user:pass@ep-xyz.neon.tech/neondb?sslmode=require"
    python scripts/setup_neon.py
"""

import sys
import os
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))


def normalize_db_url(url: str) -> str:
    """Ensure PostgreSQL URL uses the modern psycopg3 driver."""
    url = url.strip().strip("'\"")
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://") and not url.startswith("postgresql+"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def run_neon_setup():
    print("=" * 60)
    print("  KLYRO — Remote Neon PostgreSQL Database Setup")
    print("=" * 60)

    # 1. Determine Database URL
    target_url = None
    if len(sys.argv) > 1 and sys.argv[1].strip():
        target_url = sys.argv[1].strip()
    elif os.environ.get("DATABASE_URL") and not os.environ.get("DATABASE_URL", "").startswith("sqlite"):
        target_url = os.environ.get("DATABASE_URL")
    else:
        print("\nEnter your Neon PostgreSQL connection string:")
        print("Example: postgresql://klyro_owner:pass@ep-xyz.ap-southeast-1.aws.neon.tech/klyro?sslmode=require")
        try:
            target_url = input("\nDATABASE_URL: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nSetup cancelled.")
            sys.exit(1)

    if not target_url:
        print("\n[Error] No database connection string provided.")
        sys.exit(1)

    normalized_url = normalize_db_url(target_url)
    os.environ["DATABASE_URL"] = normalized_url

    # Display safe sanitized URL (masking password)
    masked_url = normalized_url
    if "@" in masked_url and "://" in masked_url:
        protocol_part, rest = masked_url.split("://", 1)
        creds, host_part = rest.split("@", 1)
        user = creds.split(":", 1)[0]
        masked_url = f"{protocol_part}://{user}:*****@{host_part}"
    print(f"\nConnecting to: {masked_url}")

    # 2. Run Alembic Migrations
    print("\n[Step 1/2] Running Alembic migrations (alembic upgrade head)...")
    try:
        from alembic.config import Config
        from alembic import command

        alembic_cfg = Config(str(root_dir / "alembic.ini"))
        alembic_cfg.set_main_option("script_location", str(root_dir / "backend" / "alembic"))
        alembic_cfg.set_main_option("sqlalchemy.url", normalized_url)
        command.upgrade(alembic_cfg, "head")
        print("✓ All migrations successfully applied to Neon Postgres.")
    except Exception as e:
        print(f"\n[Error] Alembic migration failed: {e}")
        print("\nTroubleshooting tips:")
        print("  1. Verify the Neon database credentials and hostname.")
        print("  2. Ensure your IP has access (Neon has SSL enabled by default).")
        print("  3. Make sure '?sslmode=require' is appended to the connection string.")
        sys.exit(1)

    # 3. Seed Demonstration Data
    print("\n[Step 2/2] Seeding authentic demonstration records (accounts, transactions, budgets)...")
    try:
        from backend.app.seed import seed_demo_data
        demo_user = seed_demo_data(reset=False)
        print(f"✓ Database seeded successfully!")
        print(f"  Demo Account: {demo_user.email}")
        print(f"  Demo Password: DemoPassword123!")
    except Exception as e:
        print(f"\n[Warning] Seeding encountered an issue: {e}")
        print("Your schema is created. You can re-run seeding anytime with:")
        print("  python -m backend.app.seed")
        sys.exit(1)

    print("\n" + "=" * 60)
    print("  Neon Postgres database is fully initialized and ready!")
    print("  You can now deploy or connect your Vercel project.")
    print("=" * 60)


if __name__ == "__main__":
    run_neon_setup()
