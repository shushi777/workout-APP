# Testing Patterns

**Analysis Date:** 2026-02-02

## Test Framework

**Status:** Not implemented

**Runner:**
- No test framework configured (pytest, unittest, jest, vitest not found)
- No test files present in codebase (`*.test.js`, `*.spec.js`, `*_test.py` not found)
- No test configuration files (`pytest.ini`, `jest.config.js`, `vitest.config.js` not found)

**Dependencies:**
- No testing libraries in `requirements.txt` (no pytest, pytest-flask, unittest2, etc.)
- No JavaScript testing libraries in codebase
- Flask and boto3 libraries support testing but not actively used

**Run Commands:**
```bash
# No test commands configured
# To add testing, would require:
pytest                 # Run all tests (after setup)
pytest -v              # Verbose output
pytest --cov          # Coverage report
```

## Test File Organization

**Location:**
- Not applicable (no tests present)
- Recommended pattern would be:
  - Backend: `tests/` directory at project root
  - Frontend: `static/js/__tests__/` or `static/__tests__/`

**Naming:**
- Not applicable (no tests present)
- Would follow conventions:
  - Python: `test_*.py` or `*_test.py`
  - JavaScript: `*.test.js` or `*.spec.js`

**Structure:**
- Not applicable (no tests present)
- Would follow standard xUnit pattern:
```
tests/
├── unit/
│   ├── test_config.py
│   ├── test_storage.py
│   └── test_video_processing.py
├── integration/
│   ├── test_server_api.py
│   └── test_database.py
└── fixtures/
    └── sample_videos/
```

## Test Structure

**Suite Organization:**
- Not applicable (no tests present)

**Patterns:**
- No setup/teardown patterns implemented
- No test fixtures or factories
- No assertion patterns established

## Mocking

**Framework:**
- Not used (no tests present)
- Python would use: `unittest.mock`, `pytest-mock`
- JavaScript would use: `jest.mock()`, `vitest.mock()`

**Patterns:**
- Not applicable

**What to Mock:**
- Recommended areas for mocking:
  - Database connections: Mock `get_db_connection()`
  - File operations: Mock `storage.save()`, `storage.delete()`
  - FFmpeg calls: Mock `subprocess.run()` in `video_processing.py`
  - External APIs: Mock AWS/Cloudflare API calls
  - Video files: Use small test video fixtures instead of large files

**What NOT to Mock:**
- Business logic functions (leave un-mocked to test real behavior)
- Configuration object creation
- JSON serialization/deserialization

## Fixtures and Factories

**Test Data:**
- Not implemented

**Recommended Pattern:**
```python
# tests/fixtures/video_data.py
import os
from pathlib import Path

FIXTURES_DIR = Path(__file__).parent / 'test_videos'

def get_test_video_path():
    """Get path to small test video fixture"""
    return str(FIXTURES_DIR / 'test_video_30sec.mp4')

def get_test_segments():
    """Return test segment data"""
    return [
        {
            'start': 0.0,
            'end': 10.5,
            'details': {
                'name': 'Push-ups',
                'muscleGroups': ['chest', 'triceps'],
                'equipment': ['bodyweight'],
                'removeAudio': False
            }
        },
        {
            'start': 10.5,
            'end': 20.0,
            'details': {
                'name': 'Squats',
                'muscleGroups': ['legs'],
                'equipment': ['bodyweight'],
                'removeAudio': False
            }
        }
    ]
```

**Location:**
- Would be in `tests/fixtures/` directory
- Recommended: Create small test videos (5-30 seconds) for integration tests
- Database: Use test database configured in `TestConfig` class in `config.py`

## Coverage

**Requirements:**
- Not enforced (no coverage tool configured)
- Recommended: Set minimum 70% coverage threshold

**View Coverage:**
```bash
# After implementing tests
pytest --cov=. --cov-report=html
# Open htmlcov/index.html in browser

# Or with coverage tool directly
coverage run -m pytest
coverage report
coverage html
```

## Test Types

**Unit Tests:**
- Scope: Individual functions and classes
- Approach needed:
  - Test each storage backend implementation separately (`LocalStorage`, `S3Storage`, `R2Storage`)
  - Test video processing functions (`cut_video_segment()`, `generate_thumbnail()`, `get_video_info()`)
  - Test configuration loading and validation
  - Test database helper functions (`get_or_create_muscle_group()`, `get_or_create_equipment()`)

**Example Unit Test Structure:**
```python
# tests/unit/test_storage.py
import unittest
from unittest.mock import Mock, patch, MagicMock
from storage import LocalStorage, R2Storage

class TestLocalStorage(unittest.TestCase):
    def setUp(self):
        self.storage = LocalStorage(base_path='test_output')

    def test_save_file(self):
        # Test file saving
        pass

    def test_delete_file(self):
        # Test file deletion
        pass

    def test_exists_checks_file(self):
        # Test existence check
        pass

    def tearDown(self):
        # Cleanup test files
        pass
```

**Integration Tests:**
- Scope: API endpoints, database operations, storage operations together
- Approach needed:
  - Test `/process` endpoint with sample video
  - Test `/api/timeline/save` endpoint with segments and verify database writes
  - Test exercise CRUD operations (`/api/exercises`, PUT, DELETE)
  - Test storage backend integration with actual uploads/downloads
  - Test scene detection with various video formats

**Example Integration Test Structure:**
```python
# tests/integration/test_server_api.py
import unittest
import json
from server import app

class TestTimelineAPI(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_save_timeline_creates_exercises(self):
        # Test full timeline save flow
        response = self.app.post(
            '/api/timeline/save',
            data=json.dumps({
                'videoUrl': '/download/test/video.mp4',
                'segments': [...]
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        # Verify exercises saved to database

    def test_get_exercises_filters_by_muscle(self):
        # Test exercise filtering
        response = self.app.get('/api/exercises?muscle_groups=chest')
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
```

**E2E Tests:**
- Framework: Not used (would use Playwright, Cypress, or Selenium)
- Recommended approach:
  - Test full user workflow: Upload → Scene detect → Edit timeline → Save exercises → View library
  - Mobile responsiveness testing (PWA features)
  - Share Target API testing (requires device/browser support)

## Common Patterns

**Async Testing:**
- Not applicable (no async patterns in current code)
- JavaScript async operations use `async/await` and `.catch()`

**Example Pattern for JavaScript (if tests were added):**
```javascript
// tests/timeline-editor.test.js
describe('Timeline Editor', () => {
    it('should load video metadata', async () => {
        const videoPath = '/download/test/video.mp4';
        await loadVideo(videoPath, '');
        expect(state.videoDuration).toBeGreaterThan(0);
    });

    it('should handle fetch errors gracefully', async () => {
        jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
        await loadExistingTags();
        expect(console.error).toHaveBeenCalled();
    });
});
```

**Error Testing:**
- Python pattern needed for testing exception handling:

```python
# tests/unit/test_video_processing.py
class TestVideoProcessing(unittest.TestCase):
    def test_cut_segment_raises_on_missing_file(self):
        with self.assertRaises(VideoProcessingError):
            cut_video_segment(
                input_path='/nonexistent/video.mp4',
                output_path='output.mp4',
                start_time=0,
                end_time=10
            )

    def test_invalid_codec_raises_error(self):
        with self.assertRaises(VideoProcessingError):
            cut_video_segment(
                input_path='test.mp4',
                output_path='output.mp4',
                start_time=0,
                end_time=10,
                codec='invalid_codec'
            )
```

## Manual Testing Checklist

**Since automated tests are not implemented, manual testing should cover:**

### Backend API Testing
- POST `/process` with various video formats and detection thresholds
- POST `/api/timeline/save` with multiple segments and removeAudio flag
- GET `/api/exercises` with pagination and filtering
- PUT `/api/exercises/<id>` for editing exercises
- DELETE `/api/exercises/<id>` with file cleanup verification
- POST `/share-receiver` with shared videos from mobile

### Database Testing
- Verify exercises are saved with all fields populated
- Check muscle_groups and equipment junction tables
- Verify duplicate muscle groups/equipment are not created
- Test concurrent exercise saves (race conditions)

### Storage Backend Testing
- Local storage: Verify files saved in correct directories
- R2 storage: Verify uploads to Cloudflare R2 bucket
- S3 storage: Verify uploads to AWS S3
- Verify file deletion removes from correct backend
- Test cleanup of local files when using cloud storage

### Video Processing Testing
- Test scene detection with various video durations
- Verify FFmpeg cut creates correct segment duration
- Test thumbnail generation at various timestamps
- Verify removeAudio flag removes audio from output
- Test with various video codecs (H.264, VP9, etc.)

### Frontend Testing
- Timeline canvas rendering at various zoom levels
- Drag-and-drop cut point adjustment
- Segment tagging with autocomplete
- Mobile responsiveness on iPhone/Android
- PWA installation and share target
- Offline functionality (service worker)

---

*Testing analysis: 2026-02-02*

## Recommendation

**Implement testing starting with:**
1. **Unit tests for storage backends** - Most critical for reliable uploads/downloads
2. **Unit tests for video processing** - Validate FFmpeg integration
3. **API integration tests** - Cover main workflows (upload → save → retrieve)
4. **E2E tests for core user workflow** - Full mobile workflow testing

**Tool recommendation:**
- Backend: `pytest` with `pytest-flask` and `pytest-cov`
- Frontend: `jest` with `@testing-library/dom` (or `vitest` as modern alternative)
- Coverage threshold: 70% minimum
