"""
Video Storage Abstraction Layer
Supports Local, AWS S3, and Cloudflare R2 storage backends
"""

import os
import shutil
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional, BinaryIO
import boto3
from botocore.exceptions import ClientError
from werkzeug.utils import secure_filename


class VideoStorage(ABC):
    """Abstract base class for video storage"""

    @abstractmethod
    def save(self, file_data: BinaryIO, filename: str, folder: str = "") -> str:
        """
        Save a file to storage

        Args:
            file_data: File object or binary data
            filename: Name of the file
            folder: Optional folder/prefix for organization

        Returns:
            Storage path or URL
        """
        pass

    @abstractmethod
    def delete(self, path: str) -> bool:
        """
        Delete a file from storage

        Args:
            path: Storage path or URL

        Returns:
            True if successful, False otherwise
        """
        pass

    @abstractmethod
    def exists(self, path: str) -> bool:
        """
        Check if a file exists in storage

        Args:
            path: Storage path or URL

        Returns:
            True if exists, False otherwise
        """
        pass

    @abstractmethod
    def get_url(self, path: str) -> str:
        """
        Get public URL for a file

        Args:
            path: Storage path

        Returns:
            Public URL
        """
        pass

    @abstractmethod
    def get_local_path(self, path: str) -> Optional[str]:
        """
        Get local file path (for local storage)

        Args:
            path: Storage path

        Returns:
            Local file path or None if not applicable
        """
        pass


class LocalStorage(VideoStorage):
    """Local filesystem storage implementation"""

    def __init__(self, base_path: str = "output"):
        """
        Initialize local storage

        Args:
            base_path: Base directory for storage
        """
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def save(self, file_data: BinaryIO, filename: str, folder: str = "") -> str:
        """Save file to local filesystem"""
        # Secure the filename
        safe_filename = secure_filename(filename)

        # Create folder path
        folder_path = self.base_path / folder if folder else self.base_path
        folder_path.mkdir(parents=True, exist_ok=True)

        # Full file path
        file_path = folder_path / safe_filename

        # Save the file
        if isinstance(file_data, (str, Path)):
            # If it's a path, move/copy the file
            shutil.copy2(str(file_data), str(file_path))
        else:
            # If it's a file object, write it
            with open(file_path, 'wb') as f:
                shutil.copyfileobj(file_data, f)

        # Return relative path
        return str(file_path.relative_to(self.base_path))

    def delete(self, path: str) -> bool:
        """Delete file from local filesystem"""
        try:
            file_path = self.base_path / path
            if file_path.exists():
                file_path.unlink()
                return True
            return False
        except Exception as e:
            print(f"Error deleting file {path}: {e}")
            return False

    def exists(self, path: str) -> bool:
        """Check if file exists in local filesystem"""
        file_path = self.base_path / path
        return file_path.exists()

    def get_url(self, path: str) -> str:
        """Get URL for local file (relative path for serving)"""
        return f"/download/{path}"

    def get_local_path(self, path: str) -> Optional[str]:
        """Get absolute local file path"""
        file_path = self.base_path / path
        return str(file_path) if file_path.exists() else None


class S3Storage(VideoStorage):
    """AWS S3 storage implementation"""

    def __init__(self, bucket_name: str, region: str, access_key: str, secret_key: str,
                 endpoint_url: Optional[str] = None):
        """
        Initialize S3 storage

        Args:
            bucket_name: S3 bucket name
            region: AWS region
            access_key: AWS access key
            secret_key: AWS secret key
            endpoint_url: Optional custom endpoint (for S3-compatible services)
        """
        self.bucket_name = bucket_name
        self.region = region

        # Create S3 client
        self.s3_client = boto3.client(
            's3',
            region_name=region,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            endpoint_url=endpoint_url
        )

        # Verify bucket exists
        try:
            self.s3_client.head_bucket(Bucket=bucket_name)
        except ClientError as e:
            print(f"Warning: Bucket {bucket_name} may not exist or is not accessible: {e}")

    def save(self, file_data: BinaryIO, filename: str, folder: str = "") -> str:
        """Upload file to S3"""
        # Secure the filename
        safe_filename = secure_filename(filename)

        # Create S3 key (path)
        s3_key = f"{folder}/{safe_filename}" if folder else safe_filename

        try:
            # Upload the file
            if isinstance(file_data, (str, Path)):
                # Upload from file path
                self.s3_client.upload_file(str(file_data), self.bucket_name, s3_key)
            else:
                # Upload from file object
                self.s3_client.upload_fileobj(file_data, self.bucket_name, s3_key)

            return s3_key
        except ClientError as e:
            print(f"Error uploading to S3: {e}")
            raise

    def delete(self, path: str) -> bool:
        """Delete file from S3"""
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=path)
            return True
        except ClientError as e:
            print(f"Error deleting from S3: {e}")
            return False

    def exists(self, path: str) -> bool:
        """Check if file exists in S3"""
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=path)
            return True
        except ClientError:
            return False

    def get_url(self, path: str) -> str:
        """Get public URL for S3 object"""
        return f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{path}"

    def get_local_path(self, path: str) -> Optional[str]:
        """S3 storage doesn't have local paths"""
        return None


class R2Storage(S3Storage):
    """Cloudflare R2 storage implementation (S3-compatible)"""

    def __init__(self, account_id: str, bucket_name: str, access_key: str,
                 secret_key: str, public_url: Optional[str] = None):
        """
        Initialize Cloudflare R2 storage

        Args:
            account_id: Cloudflare account ID
            bucket_name: R2 bucket name
            access_key: R2 access key
            secret_key: R2 secret key
            public_url: Optional custom domain for public access
        """
        # R2 endpoint format
        endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"

        # Initialize S3-compatible client
        super().__init__(
            bucket_name=bucket_name,
            region='auto',  # R2 uses 'auto' as region
            access_key=access_key,
            secret_key=secret_key,
            endpoint_url=endpoint_url
        )

        self.account_id = account_id
        self.public_url = public_url or f"https://{bucket_name}.r2.dev"

    def get_url(self, path: str) -> str:
        """Get public URL for R2 object"""
        return f"{self.public_url}/{path}"

    def get_key_from_url(self, url: str) -> str:
        """
        Extract storage key from public URL

        Args:
            url: Public URL (e.g., https://pub-xxxxx.r2.dev/folder/file.mp4)

        Returns:
            Storage key (e.g., folder/file.mp4)
        """
        if url.startswith(self.public_url):
            return url[len(self.public_url):].lstrip('/')
        # Fallback: try to extract path from any URL
        return url.split('/')[-3:] if '/' in url else url


def create_storage(config: dict) -> VideoStorage:
    """
    Factory function to create storage instance based on configuration

    Args:
        config: Storage configuration dict

    Returns:
        VideoStorage instance

    Example config:
        {'type': 'local', 'path': 'output'}
        {'type': 's3', 'bucket': 'my-bucket', 'region': 'us-east-1', ...}
        {'type': 'r2', 'account_id': '...', 'bucket': '...', ...}
    """
    storage_type = config.get('type', 'local')

    if storage_type == 'local':
        return LocalStorage(base_path=config.get('path', 'output'))

    elif storage_type == 's3':
        return S3Storage(
            bucket_name=config['bucket'],
            region=config['region'],
            access_key=config['access_key'],
            secret_key=config['secret_key'],
            endpoint_url=config.get('endpoint_url')
        )

    elif storage_type == 'r2':
        return R2Storage(
            account_id=config['account_id'],
            bucket_name=config['bucket'],
            access_key=config['access_key'],
            secret_key=config['secret_key'],
            public_url=config.get('public_url')
        )

    else:
        raise ValueError(f"Unsupported storage type: {storage_type}")
