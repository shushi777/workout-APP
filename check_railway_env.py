#!/usr/bin/env python3
"""
Check Railway environment and dependencies
Verifies FFmpeg, storage config, and database connection
"""
import os
import subprocess
import sys

def check_ffmpeg():
    """Check if FFmpeg is installed"""
    try:
        result = subprocess.run(
            ['ffmpeg', '-version'],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            # Extract version from first line
            version_line = result.stdout.split('\n')[0]
            print(f"  ✅ FFmpeg: {version_line}")
            return True
        else:
            print(f"  ❌ FFmpeg: Command failed")
            return False
    except FileNotFoundError:
        print(f"  ❌ FFmpeg: NOT INSTALLED")
        print(f"     Railway needs FFmpeg for video cutting!")
        print(f"     Add to railway.toml or use Nixpacks buildpack")
        return False
    except Exception as e:
        print(f"  ❌ FFmpeg: Error checking - {e}")
        return False

def check_database():
    """Check database connection"""
    db_url = os.getenv('DATABASE_PUBLIC_URL') or os.getenv('DATABASE_URL')

    if not db_url:
        print(f"  ❌ Database: No DATABASE_PUBLIC_URL env var")
        return False

    try:
        import psycopg2
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        cursor.execute("SELECT version()")
        version = cursor.fetchone()[0]
        cursor.close()
        conn.close()

        # Extract PostgreSQL version
        pg_version = version.split(',')[0]
        print(f"  ✅ Database: Connected ({pg_version})")
        return True
    except ImportError:
        print(f"  ❌ Database: psycopg2 not installed")
        return False
    except Exception as e:
        print(f"  ❌ Database: Connection failed - {e}")
        return False

def check_storage():
    """Check storage backend configuration"""
    storage_backend = os.getenv('STORAGE_BACKEND', 'local')
    print(f"  📦 Storage Backend: {storage_backend}")

    if storage_backend == 'r2':
        required = ['R2_ACCOUNT_ID', 'R2_BUCKET_NAME', 'R2_ACCESS_KEY', 'R2_SECRET_KEY', 'R2_PUBLIC_URL']
        missing = [var for var in required if not os.getenv(var)]

        if missing:
            print(f"     ❌ Missing R2 config: {', '.join(missing)}")
            return False
        else:
            print(f"     ✅ R2 config complete")
            return True

    elif storage_backend == 's3':
        required = ['S3_BUCKET_NAME', 'S3_ACCESS_KEY', 'S3_SECRET_KEY']
        missing = [var for var in required if not os.getenv(var)]

        if missing:
            print(f"     ❌ Missing S3 config: {', '.join(missing)}")
            return False
        else:
            print(f"     ✅ S3 config complete")
            return True

    elif storage_backend == 'local':
        print(f"     ⚠️  Using local storage (not recommended for Railway)")
        return True

    return True

def check_python_packages():
    """Check required Python packages"""
    required_packages = {
        'flask': 'Flask',
        'psycopg2': 'psycopg2-binary',
        'scenedetect': 'scenedetect[opencv]',
        'boto3': 'boto3',
    }

    print(f"\n📦 Python Packages:")
    all_installed = True

    for module, package in required_packages.items():
        try:
            __import__(module)
            print(f"  ✅ {package}")
        except ImportError:
            print(f"  ❌ {package} - NOT INSTALLED")
            all_installed = False

    return all_installed

def main():
    print("=" * 70)
    print("🔍 Railway Environment Check")
    print("=" * 70)

    print(f"\n🌍 Environment:")
    print(f"  • FLASK_ENV: {os.getenv('FLASK_ENV', 'not set')}")
    print(f"  • PORT: {os.getenv('PORT', '5000')}")
    print(f"  • RAILWAY_ENVIRONMENT: {os.getenv('RAILWAY_ENVIRONMENT', 'not on Railway')}")

    print(f"\n🔧 Dependencies:")
    results = {
        'ffmpeg': check_ffmpeg(),
        'database': check_database(),
        'storage': check_storage(),
    }

    # Check Python packages
    results['packages'] = check_python_packages()

    # Summary
    print("\n" + "=" * 70)
    failed = [name for name, status in results.items() if not status]

    if failed:
        print(f"❌ ISSUES DETECTED: {', '.join(failed)}")
        print(f"\n🔧 How to fix:")

        if 'ffmpeg' in failed:
            print(f"\n  FFmpeg missing:")
            print(f"    1. Add to railway.toml:")
            print(f"       [build]")
            print(f"       builder = 'nixpacks'")
            print(f"       buildCommand = 'apt-get update && apt-get install -y ffmpeg'")
            print(f"\n    2. Or use Nixpacks config:")
            print(f"       Create nixpacks.toml with:")
            print(f"       [phases.setup]")
            print(f"       aptPkgs = ['ffmpeg']")

        if 'database' in failed:
            print(f"\n  Database connection failed:")
            print(f"    • Check DATABASE_PUBLIC_URL is set in Railway")
            print(f"    • Verify PostgreSQL service is running")

        if 'storage' in failed:
            print(f"\n  Storage config incomplete:")
            print(f"    • Set all required R2/S3 environment variables")
            print(f"    • Or set STORAGE_BACKEND=local for testing")

        return 1
    else:
        print(f"✅ ALL CHECKS PASSED!")
        print(f"\nEnvironment is ready for video processing.")
        return 0

if __name__ == '__main__':
    sys.exit(main())
