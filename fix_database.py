#!/usr/bin/env python3
"""
Quick database fix script
Verifies and runs missing migrations
"""
import subprocess
import sys

print("=" * 60)
print("Database Migration Fixer")
print("=" * 60)

# Run migrations
print("\nRunning database migrations...")
result = subprocess.run([sys.executable, 'run_migrations.py'], capture_output=True, text=True)

print(result.stdout)
if result.stderr:
    print("STDERR:", result.stderr)

if result.returncode == 0:
    print("\n✅ Database schema updated successfully!")
    print("You can now use the save functionality.")
    sys.exit(0)
else:
    print("\n❌ Migration failed. Check the error messages above.")
    sys.exit(1)
