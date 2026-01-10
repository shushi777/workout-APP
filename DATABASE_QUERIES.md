# Database Query Guide

מדריך לבדיקת נתוני התרגילים בדאטה-בייס PostgreSQL

## התחברות לדאטה-בייס

### דרך 1: שורת פקודה (psql)
```bash
psql -U postgres -d workout_db
# הכנס סיסמה: 1990
```

### דרך 2: pgAdmin
1. פתח pgAdmin
2. התחבר לשרת: localhost
3. בחר Database: workout_db
4. משתמש: postgres
5. סיסמה: 1990

## שאילתות שימושיות

### 1. הצגת כל התרגילים
```sql
SELECT * FROM exercises ORDER BY created_at DESC;
```

### 2. ספירת כמות התרגילים
```sql
SELECT COUNT(*) as total_exercises FROM exercises;
```

### 3. הצגת תרגילים עם קבוצות שריר וציוד
```sql
SELECT
    e.id,
    e.exercise_name,
    e.duration,
    e.start_time,
    e.end_time,
    e.remove_audio,
    e.created_at,
    ARRAY_AGG(DISTINCT mg.name) as muscle_groups,
    ARRAY_AGG(DISTINCT eq.name) as equipment
FROM exercises e
LEFT JOIN exercise_muscle_groups emg ON e.id = emg.exercise_id
LEFT JOIN muscle_groups mg ON emg.muscle_group_id = mg.id
LEFT JOIN exercise_equipment ee ON e.id = ee.exercise_id
LEFT JOIN equipment eq ON ee.equipment_id = eq.id
GROUP BY e.id, e.exercise_name, e.duration, e.start_time, e.end_time, e.remove_audio, e.created_at
ORDER BY e.created_at DESC;
```

### 4. תרגיל ספציפי לפי שם
```sql
SELECT
    e.*,
    ARRAY_AGG(DISTINCT mg.name) as muscle_groups,
    ARRAY_AGG(DISTINCT eq.name) as equipment
FROM exercises e
LEFT JOIN exercise_muscle_groups emg ON e.id = emg.exercise_id
LEFT JOIN muscle_groups mg ON emg.muscle_group_id = mg.id
LEFT JOIN exercise_equipment ee ON e.id = ee.exercise_id
LEFT JOIN equipment eq ON ee.equipment_id = eq.id
WHERE e.exercise_name ILIKE '%push%'
GROUP BY e.id;
```

### 5. הצגת כל קבוצות השריר
```sql
SELECT * FROM muscle_groups ORDER BY name;
```

### 6. הצגת כל הציוד
```sql
SELECT * FROM equipment ORDER BY name;
```

### 7. תרגילים לפי קבוצת שריר
```sql
SELECT
    e.exercise_name,
    e.duration,
    mg.name as muscle_group
FROM exercises e
JOIN exercise_muscle_groups emg ON e.id = emg.exercise_id
JOIN muscle_groups mg ON emg.muscle_group_id = mg.id
WHERE mg.name = 'chest'
ORDER BY e.created_at DESC;
```

### 8. תרגילים לפי ציוד
```sql
SELECT
    e.exercise_name,
    e.duration,
    eq.name as equipment
FROM exercises e
JOIN exercise_equipment ee ON e.id = ee.exercise_id
JOIN equipment eq ON ee.equipment_id = eq.id
WHERE eq.name = 'dumbbells'
ORDER BY e.created_at DESC;
```

### 9. סטטיסטיקות כלליות
```sql
SELECT
    COUNT(*) as total_exercises,
    COUNT(DISTINCT e.exercise_name) as unique_exercises,
    SUM(e.duration) as total_duration_seconds,
    AVG(e.duration) as avg_duration_seconds,
    MIN(e.duration) as min_duration,
    MAX(e.duration) as max_duration
FROM exercises e;
```

### 10. תרגילים שנוסרו באודיו
```sql
SELECT
    e.exercise_name,
    e.duration,
    e.remove_audio,
    e.created_at
FROM exercises e
WHERE e.remove_audio = TRUE
ORDER BY e.created_at DESC;
```

### 11. בדיקה אם יש thumbnails
```sql
SELECT
    e.exercise_name,
    e.thumbnail_url,
    CASE
        WHEN e.thumbnail_url IS NOT NULL THEN 'Yes'
        ELSE 'No'
    END as has_thumbnail
FROM exercises e
ORDER BY e.created_at DESC;
```

### 12. מחיקת תרגיל ספציפי (זהירות!)
```sql
-- זהירות: פעולה זו תמחק את התרגיל ואת כל הקישורים שלו
DELETE FROM exercises WHERE id = 1;
```

### 13. מחיקת כל התרגילים (זהירות!)
```sql
-- זהירות: פעולה זו תמחק את כל התרגילים!
TRUNCATE TABLE exercise_muscle_groups CASCADE;
TRUNCATE TABLE exercise_equipment CASCADE;
TRUNCATE TABLE exercises CASCADE;
```

## פקודות ניהול שימושיות

### הצגת מבנה טבלה
```sql
\d exercises
\d muscle_groups
\d equipment
\d exercise_muscle_groups
\d exercise_equipment
```

### הצגת כל הטבלאות
```sql
\dt
```

### יציאה מ-psql
```sql
\q
```

## דוגמה מלאה: הוספת תרגיל ידנית

```sql
-- 1. הוסף תרגיל
INSERT INTO exercises (video_file_path, exercise_name, duration, start_time, end_time, remove_audio)
VALUES ('/download/test/test.mp4', 'Push-ups', 30.5, 0.0, 30.5, FALSE)
RETURNING id;

-- נניח שקיבלנו id = 5

-- 2. הוסף קבוצת שריר (אם לא קיימת)
INSERT INTO muscle_groups (name) VALUES ('chest') ON CONFLICT DO NOTHING;
INSERT INTO muscle_groups (name) VALUES ('triceps') ON CONFLICT DO NOTHING;

-- 3. חבר תרגיל לקבוצות שריר
INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id)
SELECT 5, id FROM muscle_groups WHERE name IN ('chest', 'triceps');

-- 4. הוסף ציוד (אם לא קיים)
INSERT INTO equipment (name) VALUES ('bodyweight') ON CONFLICT DO NOTHING;

-- 5. חבר תרגיל לציוד
INSERT INTO exercise_equipment (exercise_id, equipment_id)
SELECT 5, id FROM equipment WHERE name = 'bodyweight';
```

## טיפים

- השתמש ב-`LIMIT` כדי להגביל את מספר התוצאות:
  ```sql
  SELECT * FROM exercises ORDER BY created_at DESC LIMIT 10;
  ```

- השתמש ב-`OFFSET` לדפדוף:
  ```sql
  SELECT * FROM exercises ORDER BY created_at DESC LIMIT 10 OFFSET 10;
  ```

- החיפוש אינו תלוי רישיות באמצעות `ILIKE`:
  ```sql
  SELECT * FROM exercises WHERE exercise_name ILIKE '%squat%';
  ```
