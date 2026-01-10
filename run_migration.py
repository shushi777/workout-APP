"""
Database Migration Runner
Executes SQL migration scripts on the PostgreSQL database
"""

import psycopg2
import os
from config import Config

def run_migration(migration_file):
    """Run a single migration SQL file"""
    print(f"Running migration: {migration_file}")

    # Read migration file
    with open(migration_file, 'r', encoding='utf-8') as f:
        migration_sql = f.read()

    # Connect to database
    try:
        conn = psycopg2.connect(**Config.DB_CONFIG)
        conn.autocommit = True  # Required for CREATE INDEX IF NOT EXISTS
        cursor = conn.cursor()

        # Execute migration
        cursor.execute(migration_sql)

        print("[SUCCESS] Migration completed successfully!")

        cursor.close()
        conn.close()

        return True

    except Exception as e:
        print(f"[ERROR] Migration failed: {e}")
        return False

def main():
    """Run all pending migrations"""
    migrations_dir = 'migrations'

    # Get all .sql files in migrations directory
    migration_files = sorted([
        os.path.join(migrations_dir, f)
        for f in os.listdir(migrations_dir)
        if f.endswith('.sql')
    ])

    if not migration_files:
        print("No migration files found")
        return

    print("=" * 60)
    print("Database Migration Runner")
    print("=" * 60)
    print(f"Found {len(migration_files)} migration(s)")
    print()

    success_count = 0
    for migration_file in migration_files:
        if run_migration(migration_file):
            success_count += 1
        print()

    print("=" * 60)
    print(f"Completed: {success_count}/{len(migration_files)} migrations successful")
    print("=" * 60)

if __name__ == '__main__':
    main()
