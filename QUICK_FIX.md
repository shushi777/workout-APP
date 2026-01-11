# ⚡ תיקון מהיר - 2 דקות

## 🔴 הבעיות (מה-logs של Railway):

1. ❌ **Database:** `connection to localhost failed`
   - → `DATABASE_PUBLIC_URL` לא מוגדר!

2. ❌ **FFmpeg:** `FFmpeg is not installed or not accessible`
   - → FFmpeg לא נגיש למרות nixpacks.toml

---

## ✅ תיקון (2 דקות):

### 1. הוסף DATABASE_PUBLIC_URL

**Railway Dashboard:**
1. פתח Railway → הפרויקט שלך
2. לחץ על **PostgreSQL** database service
3. לחץ **Connect** → העתק **Public URL**
4. חזור ל**שירות הפייתון** (workout-app)
5. **Variables** → **+ New Variable**
6. שם: `DATABASE_PUBLIC_URL`
7. ערך: הדבק את ה-URL
8. **Add**

### 2. Redeploy

**Railway Dashboard:**
1. לחץ **Deployments**
2. לחץ **...** (נקודות) → **Redeploy**

זה יתקין מחדש את FFmpeg ויטען את DATABASE_PUBLIC_URL ✅

---

## 🔍 אימות

```bash
# בדוק שהמשתנה מוגדר
railway run python check_env_vars.py

# צריך לראות:
# ✅ DATABASE_PUBLIC_URL = postgresql://...
```

---

## 🎉 זהו!

אחרי Redeploy:
1. נסה להעלות וידאו
2. תייג תרגילים  
3. שמור

**אמור לעבוד!** ✅

---

## 🆘 עדיין לא עובד?

```bash
# ראה logs אחרי redeploy:
railway logs --tail 50

# בדוק FFmpeg:
railway run ffmpeg -version

# בדוק DB connection:
railway run python check_railway_env.py
```

ראה **RAILWAY_ENV_FIX.md** לפרטים מלאים.
