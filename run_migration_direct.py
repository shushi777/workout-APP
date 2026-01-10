"""
Database Migration Runner - Railway Compatible
Uses environment DATABASE_URL directly without config.py
"""

import psycopg2
import os
from urllib.parse import urlparse

def run_migration(migration_file):
    """Run a single migration SQL file"""
    print(f"Running migration: {migration_file}")

    # Get DATABASE_URL from environment
    database_url = os.getenv('DATABASE_URL')

    if not database_url:
        print("[ERROR] DATABASE_URL environment variable not set")
        return False

    print(f"Connecting to: {urlparse(database_url).hostname}")

    # Read migration file
    with open(migration_file, 'r', encoding='utf-8') as f:
        migration_sql = f.read()

    # Parse DATABASE_URL
    parsed = urlparse(database_url)

    # Connect to database
    try:
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port,
            database=parsed.path[1:],  # Remove leading '/'
            user=parsed.username,
            password=parsed.password
        )
        conn.autocommit = True
        cursor = conn.cursor()

        # Execute migration
        cursor.execute(migration_sql)

        print("[SUCCESS] Migration completed successfully!")

        cursor.close()
        conn.close()

        return True

    except Exception as e:
        print(f"[ERROR] Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all pending migrations"""
    migrations_dir = 'migrations'

    # Get all .sql files in migrations directory
    import os
    migration_files = sorted([
        os.path.join(migrations_dir, f)
        for f in os.listdir(migrations_dir)
        if f.endswith('.sql')
    ])

    if not migration_files:
        print("No migration files found")
        return

    print("=" * 60)
    print("Database Migration Runner (Railway)")
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
