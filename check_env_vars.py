#!/usr/bin/env python3
"""
Check Railway Environment Variables
Shows which critical env vars are missing
"""
import os

def main():
    print("=" * 70)
    print("🔍 Railway Environment Variables Check")
    print("=" * 70)

    # Critical variables
    checks = {
        'Database': {
            'DATABASE_PUBLIC_URL': os.getenv('DATABASE_PUBLIC_URL'),
            'DATABASE_URL': os.getenv('DATABASE_URL'),
        },
        'Storage': {
            'STORAGE_BACKEND': os.getenv('STORAGE_BACKEND', 'local'),
        },
        'R2 Config (if using R2)': {
            'R2_ACCOUNT_ID': os.getenv('R2_ACCOUNT_ID'),
            'R2_BUCKET_NAME': os.getenv('R2_BUCKET_NAME'),
            'R2_ACCESS_KEY': os.getenv('R2_ACCESS_KEY'),
            'R2_SECRET_KEY': os.getenv('R2_SECRET_KEY'),
            'R2_PUBLIC_URL': os.getenv('R2_PUBLIC_URL'),
        },
        'Flask': {
            'FLASK_ENV': os.getenv('FLASK_ENV', 'development'),
            'PORT': os.getenv('PORT', '5000'),
        }
    }

    critical_missing = []

    for category, vars in checks.items():
        print(f"\n📂 {category}:")
        for var_name, var_value in vars.items():
            if var_value:
                # Show first 30 chars only (for security)
                display_value = str(var_value)[:30] + '...' if len(str(var_value)) > 30 else var_value
                print(f"  ✅ {var_name:25} = {display_value}")
            else:
                print(f"  ❌ {var_name:25} = NOT SET")
                if category == 'Database' and var_name == 'DATABASE_PUBLIC_URL':
                    critical_missing.append(var_name)

    # Summary
    print("\n" + "=" * 70)
    if critical_missing:
        print("❌ CRITICAL VARIABLES MISSING!")
        print(f"\nMissing: {', '.join(critical_missing)}")
        print("\n🔧 How to fix:")
        print("  1. Go to Railway Dashboard")
        print("  2. Click on your app service")
        print("  3. Go to 'Variables' tab")
        print("  4. Click on PostgreSQL service → Connect → Copy 'Public URL'")
        print("  5. Add variable: DATABASE_PUBLIC_URL = <paste URL>")
        print("  6. Redeploy")
        return 1
    else:
        print("✅ All critical variables are set!")

        # Check storage backend
        storage = os.getenv('STORAGE_BACKEND', 'local')
        if storage == 'r2':
            r2_vars = ['R2_ACCOUNT_ID', 'R2_BUCKET_NAME', 'R2_ACCESS_KEY', 'R2_SECRET_KEY', 'R2_PUBLIC_URL']
            missing_r2 = [v for v in r2_vars if not os.getenv(v)]
            if missing_r2:
                print(f"\n⚠️  Storage backend is 'r2' but missing: {', '.join(missing_r2)}")
                print("   Set STORAGE_BACKEND=local for now, or configure R2 properly")

        return 0

if __name__ == '__main__':
    exit(main())
