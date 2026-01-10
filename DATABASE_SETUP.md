# PostgreSQL Database Setup for Workout App

## Windows Installation

### 1. Download PostgreSQL
1. Go to https://www.postgresql.org/download/windows/
2. Download the PostgreSQL installer (recommended version 14 or higher)
3. Run the installer

### 2. Installation Steps
1. Click "Next" through the welcome screen
2. Choose installation directory (default is fine: `C:\Program Files\PostgreSQL\{version}`)
3. Select components to install (keep all selected)
4. Choose data directory (default is fine)
5. **Set a password for the postgres superuser** - REMEMBER THIS PASSWORD!
6. Use default port: **5432**
7. Use default locale
8. Click "Next" and then "Finish"

### 3. Verify Installation
1. Open Command Prompt
2. Navigate to PostgreSQL bin directory:
   ```
   cd "C:\Program Files\PostgreSQL\{version}\bin"
   ```
3. Test connection:
   ```
   psql -U postgres
   ```
4. Enter the password you set during installation

## Database Setup

### 1. Create Database
In the psql prompt (or using pgAdmin):

```sql
CREATE DATABASE workout_db;
```

### 2. Connect to Database
```sql
\c workout_db
```

### 3. Create Tables

```sql
-- Exercises table (main table)
CREATE TABLE exercises (
    id SERIAL PRIMARY KEY,
    video_file_path TEXT NOT NULL,
    exercise_name VARCHAR(255),
    duration FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Muscle groups lookup table
CREATE TABLE muscle_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- Equipment lookup table
CREATE TABLE equipment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- Junction table: exercises to muscle groups (many-to-many)
CREATE TABLE exercise_muscle_groups (
    exercise_id INTEGER REFERENCES exercises(id) ON DELETE CASCADE,
    muscle_group_id INTEGER REFERENCES muscle_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (exercise_id, muscle_group_id)
);

-- Junction table: exercises to equipment (many-to-many)
CREATE TABLE exercise_equipment (
    exercise_id INTEGER REFERENCES exercises(id) ON DELETE CASCADE,
    equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
    PRIMARY KEY (exercise_id, equipment_id)
);
```

### 4. Verify Tables Created
```sql
\dt
```

You should see all 5 tables listed.

## Application Configuration

### 1. Update server.py
Edit the database configuration in `server.py`:

```python
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'workout_db',
    'user': 'postgres',
    'password': 'YOUR_PASSWORD_HERE'  # Replace with your postgres password
}
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Test Connection
Run the Flask server and check the console for "Database connected successfully" message:
```bash
python server.py
```

## Troubleshooting

### Connection Refused
- Make sure PostgreSQL service is running:
  - Open Services (Windows + R, type `services.msc`)
  - Find "postgresql-x64-{version}"
  - Make sure it's running

### Authentication Failed
- Double-check your password
- Make sure you're using the correct username (default is `postgres`)

### Port Already in Use
- If port 5432 is in use, you can change it in `postgresql.conf`
- Update the port in both PostgreSQL config and `server.py`

## Useful Commands

### Connect to psql
```bash
psql -U postgres -d workout_db
```

### List all databases
```sql
\l
```

### List all tables
```sql
\dt
```

### View table structure
```sql
\d exercises
```

### View all exercises
```sql
SELECT * FROM exercises;
```

### View exercises with their muscle groups
```sql
SELECT e.exercise_name, mg.name as muscle_group
FROM exercises e
JOIN exercise_muscle_groups emg ON e.id = emg.exercise_id
JOIN muscle_groups mg ON emg.muscle_group_id = mg.id;
```

### Quit psql
```sql
\q
```
