# 🔧 תיקון שגיאת 500 ב-Railway

## הבעיה
כשלוחצים על כפתור "שמור", מתקבלת שגיאה:
```
POST /api/timeline/save 500 (Internal Server Error)
GET /get-tags 500 (Internal Server Error)
```

**הסיבה:** הדאטה בייס ב-Railway חסר עמודות שנוספו בשלב 4 של הפרויקט.

---

## הפתרון (3 דקות)

### שלב 1: התקן Railway CLI

```bash
npm install -g @railway/cli
```

### שלב 2: התחבר ל-Railway

```bash
railway login
```
(יפתח דפדפן - אשר את ההתחברות)

### שלב 3: קשר את הפרויקט

```bash
cd workout-APP
railway link
```
(בחר את הפרויקט `workout-app`)

### שלב 4: בדוק את מצב הדאטה בייס

```bash
railway run python check_db_schema.py
```

אם תראה **"❌ MIGRATION NEEDED!"** - עבור לשלב 5.

### שלב 5: הרץ את ההגירה

```bash
railway run python run_migrations.py
```

**תראה:**
```
Running migration: migrations/000_initial_schema.sql
[SUCCESS] Migration completed successfully!

Running migration: migrations/001_add_timeline_tables.sql
[SUCCESS] Migration completed successfully!

Completed: 2/2 migrations successful
```

### שלב 6: אמת שהתיקון עבד

```bash
railway run python check_db_schema.py
```

**צריך לראות:**
```
✅ All required columns exist!
Database schema is up to date.
```

### שלב 7: נסה שוב לשמור תרגילים

עכשיו תעלה וידאו, תתייג תרגילים, ולחץ "שמור" - אמור לעבוד! ✅

---

## אופציה מהירה (אם אין לך Railway CLI)

**דרך Dashboard:**

1. כנס ל-https://railway.app/project/[your-project-id]
2. לחץ על **PostgreSQL** database
3. לחץ על **Data** → **Query**
4. הדבק והרץ:

```sql
-- Add missing columns
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS start_time FLOAT,
ADD COLUMN IF NOT EXISTS end_time FLOAT,
ADD COLUMN IF NOT EXISTS remove_audio BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS video_id INTEGER;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'exercises'
ORDER BY ordinal_position;
```

5. וודא שכל 5 העמודות החדשות מופיעות ברשימה

---

## מה אם זה עדיין לא עובד?

### בדוק logs של Railway:
```bash
railway logs
```

חפש שגיאות SQL כמו:
- `column "start_time" does not exist`
- `column "thumbnail_url" does not exist`

אם אתה רואה שגיאות אלה - ההגירה לא רצה. חזור על שלב 5.

### אם ההגירה נכשלת:

הרץ את ה-SQL ידנית דרך Railway Dashboard (אופציה מהירה למעלה).

---

## מידע טכני

**עמודות שנוספות:**
- `start_time` (FLOAT) - זמן התחלה של סגמנט
- `end_time` (FLOAT) - זמן סיום של סגמנט
- `remove_audio` (BOOLEAN) - האם להסיר אודיו
- `thumbnail_url` (TEXT) - URL לתמונת תצוגה מקדימה
- `video_id` (INTEGER) - קישור לוידאו המקור

**למה זה קרה?**
הקוד עודכן לגרסה חדשה (Phase 4-6) שתומכת בחיתוך וידאו, cloud storage, ותמונות תצוגה מקדימה.
הדאטה בייס ב-Railway נשאר בגרסה הישנה והצריך עדכון.

---

**צריך עזרה?** פתח issue ב-GitHub או בדוק את RAILWAY_MIGRATION_GUIDE.md למידע נוסף.
