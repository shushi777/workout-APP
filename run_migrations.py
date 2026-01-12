#!/usr/bin/env python3
"""
Database Migration Runner
Runs all SQL migrations in the migrations/ folder
"""
import psycopg2
import os
import sys
from pathlib import Path
from config import Config

def get_db_connection():
    """Get database connection from environment or config"""
    # When running via 'railway run' from local machine, we need DATABASE_PUBLIC_URL
    # because DATABASE_URL contains internal hostname (postgres.railway.internal) 
    # that only works inside Railway's network
    database_public_url = os.getenv('DATABASE_PUBLIC_URL')
    database_url = os.getenv('DATABASE_URL')
    
    # Prefer DATABASE_PUBLIC_URL for external connections (when running from local machine)
    if database_public_url:
        print(f"[Migration] Using DATABASE_PUBLIC_URL (external connection)")
        try:
            return psycopg2.connect(database_public_url)
        except Exception as e:
            print(f"[Migration] DATABASE_PUBLIC_URL failed: {e}")
            # Fall through to try DATABASE_URL if available
    
    # Try DATABASE_URL (works when running inside Railway)
    if database_url:
        print(f"[Migration] Using DATABASE_URL (internal connection)")
        try:
            return psycopg2.connect(database_url)
        except Exception as e:
            print(f"[Migration] DATABASE_URL failed: {e}")
            # Check if it's the internal hostname issue
            if 'railway.internal' in database_url:
                print(f"[Migration] WARNING: DATABASE_URL contains internal hostname.")
                print(f"[Migration] This only works when running inside Railway.")
                print(f"[Migration] Use DATABASE_PUBLIC_URL for local runs via 'railway run'")
    
    # Fallback: Use Config.DB_CONFIG (might work if config handles it correctly)
    try:
        db_config = Config.DB_CONFIG
        print(f"[Migration] Using Config.DB_CONFIG: {db_config['database']} at {db_config['host']}:{db_config['port']}")
        return psycopg2.connect(**db_config)
    except Exception as e:
        print(f"[Migration] Config.DB_CONFIG failed: {e}")
    
    # Last resort: individual variables
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': int(os.getenv('DB_PORT', 5432)),
        'database': os.getenv('DB_NAME', 'workout_db'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', '')
    }
    print(f"[Migration] Using individual environment variables (last resort)")
    return psycopg2.connect(**db_config)


def run_migrations():
    """Run all SQL migration files"""
    migrations_dir = Path(__file__).parent / 'migrations'

    if not migrations_dir.exists():
        print(f"ERROR: Migrations directory not found: {migrations_dir}")
        sys.exit(1)

    # Get all .sql files sorted by name
    migration_files = sorted(migrations_dir.glob('*.sql'))

    if not migration_files:
        print("No migration files found")
        return

    print(f"Found {len(migration_files)} migration file(s)")

    # Connect to database
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        print("✅ Database connection successful")
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        sys.exit(1)

    # Run each migration
    for migration_file in migration_files:
        print(f"\n{'='*60}")
        print(f"Running migration: {migration_file.name}")
        print('='*60)

        try:
            with open(migration_file, 'r', encoding='utf-8') as f:
                sql = f.read()

            cursor.execute(sql)
            conn.commit()
            print(f"✅ Migration {migration_file.name} completed successfully")

            # Fetch and display any results (like verification messages)
            try:
                results = cursor.fetchall()
                if results:
                    for row in results:
                        print(f"   {row}")
            except:
                pass  # No results to fetch (normal for DDL statements)

        except Exception as e:
            print(f"❌ Migration {migration_file.name} failed: {e}")
            conn.rollback()
            # Continue with next migration instead of stopping
            continue

    # Verify final schema
    print(f"\n{'='*60}")
    print("Verifying database schema...")
    print('='*60)

    try:
        # Check exercises table columns
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'exercises'
            ORDER BY ordinal_position
        """)

        print("\n📋 Exercises table columns:")
        for row in cursor.fetchall():
            print(f"   {row[0]:<20} {row[1]:<15} (Nullable: {row[2]})")

        # Check all tables
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """)

        print("\n📊 All tables:")
        for row in cursor.fetchall():
            print(f"   - {row[0]}")

        # Count exercises
        cursor.execute("SELECT COUNT(*) FROM exercises")
        count = cursor.fetchone()[0]
        print(f"\n📈 Total exercises in database: {count}")

    except Exception as e:
        print(f"Warning: Could not verify schema: {e}")

    cursor.close()
    conn.close()

    print(f"\n{'='*60}")
    print("✅ All migrations completed!")
    print('='*60)


if __name__ == '__main__':
    print("=" * 60)
    print("Database Migration Runner")
    print("=" * 60)
    run_migrations()
