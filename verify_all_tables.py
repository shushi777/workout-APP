#!/usr/bin/env python3
"""
Comprehensive database verification for Railway
Checks all tables and their relationships
"""
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def main():
    database_url = os.getenv('DATABASE_PUBLIC_URL') or os.getenv('DATABASE_URL')

    if not database_url:
        print("❌ ERROR: DATABASE_PUBLIC_URL not set")
        print("Run with: railway run python verify_all_tables.py")
        return 1

    try:
        print("=" * 70)
        print("🔍 Comprehensive Database Verification")
        print("=" * 70)

        conn = psycopg2.connect(database_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Check all tables exist
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)

        existing_tables = [row['table_name'] for row in cursor.fetchall()]

        print(f"\n✅ Connected to database")
        print(f"\n📋 Found {len(existing_tables)} tables:")
        for table in existing_tables:
            print(f"  • {table}")

        # Required tables
        required_tables = [
            'exercises',
            'muscle_groups',
            'equipment',
            'exercise_muscle_groups',
            'exercise_equipment'
        ]

        print(f"\n🔍 Checking required tables...")
        missing_tables = []
        for table in required_tables:
            if table in existing_tables:
                # Count rows
                cursor.execute(f"SELECT COUNT(*) as count FROM {table}")
                count = cursor.fetchone()['count']
                print(f"  ✅ {table:30} ({count} rows)")
            else:
                print(f"  ❌ {table:30} MISSING!")
                missing_tables.append(table)

        # Check exercises table schema
        if 'exercises' in existing_tables:
            print(f"\n📊 exercises table schema:")
            cursor.execute("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'exercises'
                ORDER BY ordinal_position
            """)

            columns = cursor.fetchall()
            required_columns = ['start_time', 'end_time', 'remove_audio', 'thumbnail_url']

            for col in columns:
                is_new = " ✨ NEW" if col['column_name'] in required_columns else ""
                print(f"  • {col['column_name']:25} {col['data_type']:15}{is_new}")

        # Check foreign key constraints
        print(f"\n🔗 Checking foreign key constraints...")
        cursor.execute("""
            SELECT
                tc.constraint_name,
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            ORDER BY tc.table_name, tc.constraint_name
        """)

        fk_constraints = cursor.fetchall()
        if fk_constraints:
            for fk in fk_constraints:
                print(f"  • {fk['table_name']}.{fk['column_name']} → {fk['foreign_table_name']}.{fk['foreign_column_name']}")
        else:
            print("  ⚠️  No foreign key constraints found")

        cursor.close()
        conn.close()

        # Final verdict
        print("\n" + "=" * 70)
        if missing_tables:
            print("❌ MISSING TABLES DETECTED!")
            print(f"\nMissing: {', '.join(missing_tables)}")
            print("\nFix: Run migrations with:")
            print("  railway run python run_migrations.py")
            return 1
        else:
            print("✅ ALL TABLES EXIST!")
            print("\nDatabase schema looks good.")
            print("\nIf you're still getting 500 errors, check:")
            print("  1. Railway logs: railway logs")
            print("  2. FFmpeg installation (required for video cutting)")
            print("  3. Storage backend configuration (R2/S3 credentials)")
            return 0

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    exit(main())
