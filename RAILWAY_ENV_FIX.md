# 🔧 תיקון Environment Variables ב-Railway

## הבעיות שזוהו מה-logs

### ❌ בעיה 1: Database Connection Failed
```
connection to server at "localhost" (::1), port 5432 failed
```

**סיבה:** `DATABASE_PUBLIC_URL` לא מוגדר ב-Railway
**תוצאה:** הקוד משתמש בdefault `localhost` ונכשל

### ❌ בעיה 2: FFmpeg לא נגיש
```
[Timeline Save] Video cutting failed: FFmpeg is not installed or not accessible
```

**סיבה:** FFmpeg לא מותקן או לא ב-PATH

---

## 🚀 פתרון מהיר (5 דקות)

### שלב 1: הגדר DATABASE_PUBLIC_URL

**Railway Dashboard:**

1. פתח **https://railway.app** → הפרויקט שלך
2. לחץ על **שירות הפייתון** (workout-app)
3. לחץ על **Variables** (טאב למעלה)
4. חפש את **PostgreSQL database service** בפרויקט
5. לחץ על **PostgreSQL** → **Connect** → **Public URL**
6. העתק את ה-URL (מתחיל ב-`postgresql://`)

7. **חזור לשירות הפייתון** → **Variables**
8. לחץ **+ New Variable**
9. שם: `DATABASE_PUBLIC_URL`
10. ערך: הדבק את ה-URL שהעתקת
11. לחץ **Add**

### שלב 2: אימות FFmpeg

**Railway מתקין FFmpeg דרך nixpacks.toml, אבל צריך לוודא שזה עובד:**

**אופציה A: Redeploy**

1. ב-Railway Dashboard של השירות
2. לחץ **Deployments** → **...** → **Redeploy**
3. זה יבנה מחדש עם nixpacks.toml ויתקין FFmpeg

**אופציה B: בדוק אם FFmpeg מותקן**

אחרי redeploy, בדוק:
```bash
railway run ffmpeg -version
```

אם עדיין לא עובד, תוודא שהקובץ `nixpacks.toml` בשורש הפרויקט.

### שלב 3: Redeploy

לחץ על **Deploy** → **Redeploy** (או עשה git push)

Railway יעשה redeploy עם:
- ✅ DATABASE_PUBLIC_URL מוגדר
- ✅ FFmpeg מותקן

---

## 🔍 אימות

### בדוק Connection String

```bash
railway run python -c "import os; print('DB URL:', os.getenv('DATABASE_PUBLIC_URL'))"
```

צריך לראות:
```
DB URL: postgresql://postgres:xxxxx@xxxx.railway.app:5432/railway
```

אם תראה `None` - המשתנה לא מוגדר!

### בדוק FFmpeg

```bash
railway run ffmpeg -version
```

צריך לראות:
```
ffmpeg version 4.x.x
```

### בדוק Database Connection

```bash
railway run python check_railway_env.py
```

צריך לראות:
```
✅ Database: Connected (PostgreSQL 15.x)
✅ FFmpeg: ffmpeg version 4.x.x
```

---

## 🎯 למה זה קורה?

### Database Connection

**ב-`config.py` (שורה 34):**
```python
DATABASE_URL = os.getenv('DATABASE_PUBLIC_URL')

if DATABASE_URL:
    # Use Railway URL ✅
    parsed = urlparse(DATABASE_URL)
    DB_CONFIG = {...}
else:
    # Use localhost (development) ❌ ← זה מה שקורה ב-Railway!
    DB_CONFIG = {
        'host': 'localhost',  # ← הבעיה!
        ...
    }
```

**פתרון:** הגדר `DATABASE_PUBLIC_URL` ב-Railway environment variables

### FFmpeg

Railway צריך לבנות מחדש עם `nixpacks.toml` כדי להתקין FFmpeg.

---

## 📋 Checklist

- [ ] הוספתי `DATABASE_PUBLIC_URL` ל-Railway Variables
- [ ] עשיתי Redeploy
- [ ] בדקתי ש-FFmpeg מותקן: `railway run ffmpeg -version`
- [ ] בדקתי ש-DB connection עובד: `railway run python check_railway_env.py`
- [ ] נסיתי לשמור תרגילים שוב

---

## 🆘 עדיין לא עובד?

### אם Database עדיין נכשל:

**בדוק שה-Variable מוגדר:**
```bash
railway variables
```

צריך לראות:
```
DATABASE_PUBLIC_URL=postgresql://...
```

**אם לא רואה** - הוסף ידנית דרך Dashboard.

### אם FFmpeg עדיין חסר:

**אופציה 1: Build Command**

Railway Dashboard → Settings → Build:
```bash
apt-get update && apt-get install -y ffmpeg
```

**אופציה 2: Dockerfile**

צור `Dockerfile` במקום nixpacks:
```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["python", "server.py"]
```

---

## 🎉 אחרי התיקון

נסה שוב:
1. העלה וידאו
2. תייג תרגילים
3. לחץ "שמור"

צריך לעבוד! ✅

---

**קובץ זה נוצר לאיתור הבעיה מ-Railway logs**
