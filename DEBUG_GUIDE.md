# 🔍 מדריך איתור תקלות - שגיאת 500

הטבלאות נראות תקינות אבל עדיין יש שגיאה 500? בואו נמצא את הבעיה האמיתית.

---

## שלב 1: בדוק את כל הטבלאות

```bash
railway run python verify_all_tables.py
```

**מה זה בודק:**
- ✅ האם כל 5 הטבלאות קיימות (exercises, muscle_groups, equipment, exercise_muscle_groups, exercise_equipment)
- ✅ האם העמודות החדשות נוספו
- ✅ האם יש foreign keys תקינים

**אם תראה "MISSING TABLES":**
```bash
railway run python run_migrations.py
```

---

## שלב 2: בדוק את סביבת Railway

```bash
railway run python check_railway_env.py
```

**מה זה בודק:**
- ✅ FFmpeg מותקן (נדרש לחיתוך וידאו!)
- ✅ חיבור לדאטה בייס
- ✅ הגדרות Storage (R2/S3/Local)
- ✅ חבילות Python

**אם FFmpeg חסר** - זו כנראה הבעיה! ראה "תיקון FFmpeg" למטה.

---

## שלב 3: ראה את השגיאה המדויקת

```bash
railway logs --tail 50
```

חפש שורות עם:
- ❌ `ERROR:` - שגיאות Python
- ❌ `500 Internal Server Error` - שגיאות HTTP
- ❌ `column "..." does not exist` - עמודה חסרה
- ❌ `relation "..." does not exist` - טבלה חסרה
- ❌ `ffmpeg: not found` - FFmpeg חסר
- ❌ `Failed to upload` - בעיה עם R2/S3

**דוגמה לשגיאה טיפוסית:**
```
ERROR: column "start_time" of relation "exercises" does not exist
→ פתרון: הרץ את ההגירה
```

```
ERROR: [Errno 2] No such file or directory: 'ffmpeg'
→ פתרון: התקן FFmpeg (ראה למטה)
```

```
ERROR: Failed to upload to R2: AccessDenied
→ פתרון: בדוק את R2_ACCESS_KEY ו-R2_SECRET_KEY
```

---

## בעיות נפוצות ופתרונות

### 🎬 בעיה 1: FFmpeg חסר

**תסמינים:**
- `POST /api/timeline/save 500`
- בלוגים: `ffmpeg: not found` או `Failed to cut video segment`

**פתרון A: דרך Nixpacks (מומלץ)**

1. צור קובץ `nixpacks.toml` בשורש הפרויקט:
```toml
[phases.setup]
aptPkgs = ['ffmpeg']
```

2. Commit ו-Push:
```bash
git add nixpacks.toml
git commit -m "Add FFmpeg to Railway via Nixpacks"
git push
```

3. Railway יעשה redeploy אוטומטי עם FFmpeg

**פתרון B: דרך railway.toml**

1. צור קובץ `railway.toml`:
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "python server.py"
```

2. בהגדרות Railway, הוסף Build Command:
```
apt-get update && apt-get install -y ffmpeg && pip install -r requirements.txt
```

**אימות:**
```bash
railway run python check_railway_env.py
```
צריך לראות: ✅ FFmpeg: ffmpeg version...

---

### 🗄️ בעיה 2: טבלאות חסרות

**תסמינים:**
- `GET /get-tags 500`
- בלוגים: `relation "muscle_groups" does not exist`

**פתרון:**
```bash
railway run python run_migrations.py
```

---

### ☁️ בעיה 3: Storage Backend (R2/S3)

**תסמינים:**
- `POST /api/timeline/save 500`
- בלוגים: `Failed to upload` או `AccessDenied`

**פתרון:**

**אופציה 1: השתמש ב-Local Storage (זמני)**
```bash
# בהגדרות Railway Environment Variables:
STORAGE_BACKEND=local
```
Redeploy האפליקציה.

**אופציה 2: תקן R2 Config**

בדוק ש-5 המשתנים האלה מוגדרים ב-Railway:
- `R2_ACCOUNT_ID`
- `R2_BUCKET_NAME`
- `R2_ACCESS_KEY`
- `R2_SECRET_KEY`
- `R2_PUBLIC_URL`

ווידוא:
```bash
railway run python -c "import os; print('R2_BUCKET_NAME:', os.getenv('R2_BUCKET_NAME'))"
```

---

### 🐛 בעיה 4: שגיאת Python כללית

**מה לעשות:**

1. **ראה logs:**
   ```bash
   railway logs --tail 100 > error.log
   cat error.log
   ```

2. **חפש את השגיאה:**
   - שורה שמתחילה ב-`Traceback`
   - שורה שמתחילה ב-`ERROR:`
   - שורה עם `Exception:`

3. **העתק את השגיאה וחפש ב-Google** או שאל אותי

---

## סקריפטים לאיתור תקלות

| סקריפט | מה הוא עושה |
|--------|-------------|
| `verify_all_tables.py` | בודק שכל הטבלאות קיימות |
| `check_railway_env.py` | בודק FFmpeg, DB, Storage |
| `check_db_schema.py` | בודק עמודות בטבלת exercises |
| `run_migrations.py` | מריץ הגירות DB |

---

## Checklist איתור תקלות

- [ ] ✅ **כל הטבלאות קיימות** (`verify_all_tables.py`)
- [ ] ✅ **FFmpeg מותקן** (`check_railway_env.py`)
- [ ] ✅ **Storage Backend מוגדר** (local/r2/s3)
- [ ] ✅ **Database connection עובד**
- [ ] ✅ **ראיתי את ה-logs** (`railway logs --tail 50`)

אם עברת על כל הצ'קליסט והשגיאה עדיין קיימת:
1. העתק את ה-logs המלאים
2. צור issue ב-GitHub עם ה-logs
3. או שאל אותי עם ה-logs

---

## פקודות מהירות

```bash
# איתור תקלה מלא
railway run python verify_all_tables.py
railway run python check_railway_env.py
railway logs --tail 50

# תיקון טבלאות
railway run python run_migrations.py

# תיקון FFmpeg - צור nixpacks.toml ועשה push

# זמני - השתמש בlocal storage
# Railway Dashboard → Environment Variables:
# STORAGE_BACKEND=local
```

---

**💡 טיפ:** רוב השגיאות 500 נגרמות מ:
1. 🎬 **FFmpeg חסר** (70% מהמקרים)
2. 🗄️ **טבלאות חסרות** (20%)
3. ☁️ **Storage config** (10%)

התחל מלבדוק FFmpeg!
