# 🎬 תיקון FFmpeg ב-Railway

## הבעיה הסבירה ביותר

הטבלאות בדאטה בייס תקינות ✅, אבל עדיין יש שגיאת 500 כי **FFmpeg חסר ב-Railway**.

FFmpeg נדרש כדי:
- ✂️ לחתוך וידאו לסגמנטים
- 🖼️ ליצור thumbnails
- 🔇 להסיר אודיו (אם נבחר)

---

## הפתרון (2 דקות)

### שלב 1: Commit את nixpacks.toml

```bash
git add nixpacks.toml
git commit -m "Add FFmpeg to Railway via Nixpacks"
git push
```

### שלב 2: Railway יעשה Redeploy אוטומטי

Railway יזהה את `nixpacks.toml` ויתקין FFmpeg אוטומטית! 🚀

### שלב 3: חכה ל-Deploy להסתיים

ב-Railway Dashboard תראה:
```
Building...
→ Installing system packages: ffmpeg
→ Installing Python dependencies
→ Starting server
✓ Deployed successfully
```

### שלב 4: נסה שוב

עכשיו תעלה וידאו ותשמור תרגילים - אמור לעבוד! ✅

---

## אימות

אחרי ה-deploy, בדוק ש-FFmpeg מותקן:

```bash
railway run python check_railway_env.py
```

צריך לראות:
```
✅ FFmpeg: ffmpeg version 4.x.x
```

---

## מה עוד יכול להיות?

אם FFmpeg מותקן אבל עדיין יש שגיאה, הרץ:

```bash
# בדוק טבלאות
railway run python verify_all_tables.py

# בדוק סביבה
railway run python check_railway_env.py

# ראה logs
railway logs --tail 50
```

ראה **DEBUG_GUIDE.md** למדריך מפורט.

---

## למה nixpacks.toml?

Railway משתמש ב-Nixpacks לבניית האפליקציה.  
`nixpacks.toml` אומר ל-Railway להתקין FFmpeg בזמן הבנייה.

**לפני:**
```
[Build] ✅ Python installed
[Build] ❌ FFmpeg missing
[Deploy] ❌ Video cutting fails (500 error)
```

**אחרי:**
```
[Build] ✅ Python installed
[Build] ✅ FFmpeg installed
[Deploy] ✅ Video cutting works!
```

---

**קבצים שנוספו:**
- ✅ `nixpacks.toml` - מתקין FFmpeg
- ✅ `verify_all_tables.py` - בודק טבלאות
- ✅ `check_railway_env.py` - בודק FFmpeg + סביבה
- ✅ `DEBUG_GUIDE.md` - מדריך איתור תקלות
