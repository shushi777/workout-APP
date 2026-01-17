# 🛠️ מדריך פיתוח מקומי

מדריך זה מסביר איך להריץ את הפרויקט מקומית כדי לעבוד על באגים ולפתח, בזמן שהפרויקט רץ ב-production.

## 📋 דרישות מוקדמות

1. **Python 3.13.3** - הורד מ-[python.org](https://www.python.org/downloads/)
2. **PostgreSQL 14+** - הורד מ-[postgresql.org](https://www.postgresql.org/download/windows/)
3. **FFmpeg** - הורד מ-[ffmpeg.org](https://ffmpeg.org/download.html)
4. **Git** - כבר מותקן אם אתה קורא את זה

## 🚀 התקנה והגדרה

### שלב 1: התקנת PostgreSQL

אם עדיין לא התקנת PostgreSQL:

1. הורד והתקן מ-[postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. **זכור את הסיסמה** שהגדרת למשתמש `postgres`
3. ודא שהשרת רץ (בדרך כלל רץ אוטומטית)

### שלב 2: יצירת מסד הנתונים

פתח Command Prompt או PowerShell והרץ:

```bash
# התחבר ל-PostgreSQL
psql -U postgres
```

לאחר מכן, בתוך psql:

```sql
-- צור את מסד הנתונים
CREATE DATABASE workout_db;

-- צא מ-psql
\q
```

### שלב 3: התקנת FFmpeg

1. הורד FFmpeg מ-[ffmpeg.org/download.html](https://ffmpeg.org/download.html)
2. חלץ את הקבצים לתיקייה (למשל `C:\ffmpeg`)
3. הוסף את התיקייה `bin` ל-PATH:
   - פתח "משתני סביבה" ב-Windows
   - ערוך את המשתנה `Path`
   - הוסף את הנתיב `C:\ffmpeg\bin` (או הנתיב שלך)

**אימות:** פתח Command Prompt חדש והרץ:
```bash
ffmpeg -version
```

### שלב 4: הגדרת סביבת הפיתוח

1. **התקן את התלויות של Python:**

```bash
pip install -r requirements.txt
```

2. **צור קובץ `.env` מקומי:**

```bash
# העתק את קובץ הדוגמה
copy .env.example .env
```

3. **ערוך את קובץ `.env`:**

פתח את `.env` בעורך טקסט ועדכן את הפרטים הבאים:

```env
# ודא שהסיסמה של PostgreSQL נכונה
DB_PASSWORD=הסיסמה_שלך_לפוסטגרס

# עבור פיתוח מקומי, השתמש ב-local storage
STORAGE_BACKEND=local
```

**חשוב:** קובץ `.env` לא צריך להיות ב-Git! הוא כבר ב-`.gitignore`.

### שלב 5: הרצת Migrations

הרץ את ה-migrations כדי ליצור את הטבלאות במסד הנתונים:

```bash
python run_migration.py
```

אם הכל עבד, תראה הודעת הצלחה.

## 🏃 הרצת השרת המקומי

### הפעלת השרת

```bash
python server.py
```

השרת יתחיל לרוץ על `http://localhost:5000`

פתח את הדפדפן וגש ל:
```
http://localhost:5000
```

### אימות שהכל עובד

1. פתח את הדפדפן ב-`http://localhost:5000`
2. נסה להעלות וידאו קטן
3. בדוק שהכל עובד

## 🔧 עבודה על באגים

### 1. בדיקת הלוגים

כשהשרת רץ, תראה לוגים בקונסול. אם יש שגיאות, הן יופיעו שם.

### 2. מצב Debug

השרת רץ במצב `DEBUG=True` אוטומטית בפיתוח מקומי, כך שתקבל:
- הודעות שגיאה מפורטות
- Reload אוטומטי כשמשנים קבצים
- Debug toolbar (אם מותקן)

### 3. בדיקת מסד הנתונים

אפשר להתחבר למסד הנתונים ולבדוק את הנתונים:

```bash
psql -U postgres -d workout_db
```

לאחר מכן:
```sql
-- בדוק את הטבלאות
\dt

-- בדוק את התרגילים
SELECT * FROM exercises LIMIT 10;
```

## 📤 העלאת שינויים ל-GitHub

### תהליך העבודה המומלץ

1. **ודא שאתה על branch נכון:**
   ```bash
   git status
   git branch
   ```

2. **צור branch חדש לעבודה (מומלץ):**
   ```bash
   git checkout -b fix/bug-description
   ```
   או אם אתה כבר על branch:
   ```bash
   git checkout -b feature/new-feature
   ```

3. **עשה את השינויים שלך** ובדוק שהכל עובד מקומית

4. **הוסף את הקבצים ששינית:**
   ```bash
   git add .
   ```
   או קבצים ספציפיים:
   ```bash
   git add server.py config.py
   ```

5. **צור commit:**
   ```bash
   git commit -m "תיאור קצר של התיקון/השינוי"
   ```

6. **דחוף ל-GitHub:**
   ```bash
   git push origin fix/bug-description
   ```
   (החלף `fix/bug-description` בשם ה-branch שלך)

7. **צור Pull Request** ב-GitHub (אם צריך)

### ⚠️ דברים חשובים לפני Commit

**אל תעלה את הקבצים הבאים:**
- `.env` - מכיל סיסמאות ומידע רגיש
- `__pycache__/` - קבצי Python מודפסים
- `uploads/` - קבצים שהועלו
- `output/` - קבצי פלט

**ודא ש-`.gitignore` כולל אותם** (אמור להיות כבר שם).

### בדיקת מה שונה לפני Commit

```bash
# ראה מה שונה
git diff

# ראה אילו קבצים שונו
git status
```

## 🔄 סנכרון עם Production

### לפני שמתחילים לעבוד

1. **משוך את השינויים האחרונים:**
   ```bash
   git pull origin main
   ```
   (או `master` אם זה השם של ה-branch הראשי שלך)

### אחרי שסיימת לעבוד

1. **ודא שהכל עובד מקומית**
2. **העלה את השינויים** (כמו שמתואר למעלה)
3. **אם יש CI/CD**, הוא יריץ את הבדיקות אוטומטית
4. **אם יש Railway auto-deploy**, השינויים יעלו ל-production אוטומטית

## 🐛 פתרון בעיות נפוצות

### השרת לא מתחיל

**בעיה:** `ModuleNotFoundError`
**פתרון:** ודא שהתקנת את כל התלויות:
```bash
pip install -r requirements.txt
```

### שגיאת חיבור למסד נתונים

**בעיה:** `could not connect to server`
**פתרון:**
1. ודא ש-PostgreSQL רץ
2. בדוק את הסיסמה ב-`.env`
3. ודא שה-port הוא 5432

### FFmpeg לא נמצא

**בעיה:** `ffmpeg: command not found`
**פתרון:**
1. ודא ש-FFmpeg מותקן
2. ודא שהוא ב-PATH
3. פתח Command Prompt חדש אחרי הוספת FFmpeg ל-PATH

### שגיאת Migration

**בעיה:** `relation already exists`
**פתרון:** זה אומר שהטבלאות כבר קיימות. זה בסדר, אפשר להתעלם.

## 📝 סיכום - תהליך עבודה מהיר

```bash
# 1. משוך שינויים אחרונים
git pull origin main

# 2. צור branch חדש
git checkout -b fix/my-bug

# 3. הרץ את השרת
python server.py

# 4. עשה את השינויים שלך...

# 5. הוסף וצור commit
git add .
git commit -m "תיקון: תיאור הבאג"

# 6. דחוף ל-GitHub
git push origin fix/my-bug
```

## 💡 טיפים

- **תמיד עבד על branch נפרד** - לא ישירות על `main`
- **בדוק מקומית לפני commit** - ודא שהכל עובד
- **עשה commits קטנים ותכופים** - קל יותר לחזור אחורה אם צריך
- **כתוב הודעות commit ברורות** - עזור לעצמך בעתיד

---

**בהצלחה! 🚀**
