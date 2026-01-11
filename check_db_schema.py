#!/usr/bin/env python3
"""
Check database schema to verify migrations ran
"""
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def main():
    # Get database URL from environment
    database_url = os.getenv('DATABASE_PUBLIC_URL') or os.getenv('DATABASE_URL')

    if not database_url:
        print("❌ ERROR: DATABASE_PUBLIC_URL environment variable not set")
        print("This script needs to run on Railway with: railway run python check_db_schema.py")
        return 1

    try:
        print("=" * 60)
        print("Database Schema Checker")
        print("=" * 60)
        print(f"Connecting to database...")

        conn = psycopg2.connect(database_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Check exercises table columns
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'exercises'
            ORDER BY ordinal_position
        """)

        columns = cursor.fetchall()

        print("\n✅ Connected successfully!")
        print(f"\nexercises table has {len(columns)} columns:\n")

        required_columns = ['start_time', 'end_time', 'remove_audio', 'thumbnail_url', 'video_id']
        missing_columns = []

        for col in columns:
            status = ""
            if col['column_name'] in required_columns:
                status = " ✅ (Phase 4 column)"
            print(f"  {col['column_name']:20} {col['data_type']:20} nullable={col['is_nullable']}{status}")

        # Check for missing required columns
        existing_column_names = [col['column_name'] for col in columns]
        for req_col in required_columns:
            if req_col not in existing_column_names:
                missing_columns.append(req_col)

        print("\n" + "=" * 60)
        if missing_columns:
            print("❌ MIGRATION NEEDED!")
            print(f"\nMissing columns: {', '.join(missing_columns)}")
            print("\nTo fix, run:")
            print("  railway run python run_migrations.py")
        else:
            print("✅ All required columns exist!")
            print("\nDatabase schema is up to date.")
        print("=" * 60)

        cursor.close()
        conn.close()

        return 0 if not missing_columns else 1

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    exit(main())
