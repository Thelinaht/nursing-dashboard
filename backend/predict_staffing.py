import mysql.connector
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import json
import sys

# ── 1. Connect to your database ────────────────────────────
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="your_password",   # ← change this
    database="nursing_dashboard"
)

# ── 2. Pull historical data using your exact columns ───────
df = pd.read_sql("""
    SELECT 
        da.unit,
        da.submission_date,
        DAYOFWEEK(da.submission_date)   AS day_of_week,
        MONTH(da.submission_date)       AS month,
        DAYOFMONTH(da.submission_date)  AS day_of_month,
        COUNT(da.nurse_id)              AS nurse_count,
        rr.ratio_value,
        rr.safe_limit,
        CASE 
            WHEN COUNT(da.nurse_id) < rr.safe_limit 
            THEN 1 ELSE 0 
        END AS was_understaffed
    FROM Daily_assignment da
    JOIN Ratio_rule rr ON da.ratio_id = rr.ratio_id
    GROUP BY 
        da.unit,
        da.submission_date,
        rr.ratio_value,
        rr.safe_limit
""", conn)

print(f"✅ Loaded {len(df)} rows from database")
print(f"✅ Class balance:\n{df['was_understaffed'].value_counts()}")

# ── 3. Prepare features ────────────────────────────────────
features = [
    'day_of_week',
    'month',
    'day_of_month',
    'nurse_count',
    'ratio_value'
]

X = df[features]
y = df['was_understaffed']

# ── 4. Split into train and test sets ──────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42
)

# ── 5. Train the model ─────────────────────────────────────
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)
model.fit(X_train, y_train)

# ── 6. Evaluate the model ──────────────────────────────────
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"\n✅ Model accuracy: {accuracy * 100:.1f}%")
print("\n✅ Classification Report:")
print(classification_report(y_test, y_pred,
      target_names=['Normal', 'Understaffed']))

# ── 7. Predict for a specific unit and date ────────────────
# Usage: python predict_staffing.py "ICU" "2026-07-01"

if len(sys.argv) == 3:
    unit = sys.argv[1]
    date = sys.argv[2]

    # Get that unit's ratio rule
    rule = pd.read_sql(f"""
        SELECT ratio_value, safe_limit
        FROM Ratio_rule
        WHERE unit = '{unit}'
        LIMIT 1
    """, conn)

    if rule.empty:
        print(json.dumps({
            "error": f"Unit '{unit}' not found in Ratio_rule"
        }))
        sys.exit(1)

    # Get how many nurses are assigned on that date
    assigned = pd.read_sql(f"""
        SELECT COUNT(da.nurse_id) AS nurse_count
        FROM Daily_assignment da
        JOIN Nursing_staff ns ON da.nurse_id = ns.nurse_id
        WHERE da.unit        = '{unit}'
          AND da.submission_date = '{date}'
          AND ns.status      = 'Active'
    """, conn)

    import datetime
    d             = datetime.datetime.strptime(date, "%Y-%m-%d")
    day_of_week   = d.isoweekday()
    month         = d.month
    day_of_month  = d.day
    nurse_count   = int(assigned['nurse_count'].iloc[0])
    ratio_value   = float(rule['ratio_value'].iloc[0])
    safe_limit    = int(rule['safe_limit'].iloc[0])

    prediction_input = pd.DataFrame([{
        'day_of_week':  day_of_week,
        'month':        month,
        'day_of_month': day_of_month,
        'nurse_count':  nurse_count,
        'ratio_value':  ratio_value
    }])

    probability = model.predict_proba(prediction_input)[0][1]
    risk_level  = (
        "HIGH"   if probability > 0.7 else
        "MEDIUM" if probability > 0.4 else
        "LOW"
    )

    result = {
        "unit":        unit,
        "date":        date,
        "probability": round(probability * 100, 1),
        "risk_level":  risk_level,
        "nurse_count": nurse_count,
        "safe_limit":  safe_limit,
        "message":     (
            f"⚠️ HIGH risk: {unit} is likely understaffed on {date}"
            if risk_level == "HIGH" else
            f"⚠️ MEDIUM risk: Monitor {unit} staffing on {date}"
            if risk_level == "MEDIUM" else
            f"✅ Staffing looks normal for {unit} on {date}"
        )
    }

    print("\n── Prediction Result ──────────────────────")
    print(json.dumps(result, indent=2))

else:
    # No arguments → predict for ALL units tomorrow
    import datetime
    tomorrow     = datetime.date.today() + datetime.timedelta(days=1)
    date         = str(tomorrow)
    day_of_week  = tomorrow.isoweekday()
    month        = tomorrow.month
    day_of_month = tomorrow.day

    print("\n── Predictions for Tomorrow ───────────────")

    units = pd.read_sql(
        "SELECT DISTINCT unit FROM Ratio_rule", conn
    )

    for _, row in units.iterrows():
        unit = row['unit']

        rule = pd.read_sql(f"""
            SELECT ratio_value, safe_limit
            FROM Ratio_rule
            WHERE unit = '{unit}'
            LIMIT 1
        """, conn)

        assigned = pd.read_sql(f"""
            SELECT COUNT(da.nurse_id) AS nurse_count
            FROM Daily_assignment da
            JOIN Nursing_staff ns ON da.nurse_id = ns.nurse_id
            WHERE da.unit             = '{unit}'
              AND da.submission_date  = '{date}'
              AND ns.status           = 'Active'
        """, conn)

        nurse_count  = int(assigned['nurse_count'].iloc[0])
        ratio_value  = float(rule['ratio_value'].iloc[0])
        safe_limit   = int(rule['safe_limit'].iloc[0])

        prediction_input = pd.DataFrame([{
            'day_of_week':  day_of_week,
            'month':        month,
            'day_of_month': day_of_month,
            'nurse_count':  nurse_count,
            'ratio_value':  ratio_value
        }])

        probability = model.predict_proba(prediction_input)[0][1]
        risk_level  = (
            "HIGH"   if probability > 0.7 else
            "MEDIUM" if probability > 0.4 else
            "LOW"
        )

        icon = "🔴" if risk_level == "HIGH" else \
               "🟡" if risk_level == "MEDIUM" else "🟢"

        print(f"{icon} {unit:<15} "
              f"Risk: {risk_level:<8} "
              f"({probability*100:.1f}%) "
              f"Nurses: {nurse_count}/{safe_limit}")

# pyrefly: ignore [parse-error]
conn.close()import mysql.connector
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import json
import sys

# ── 1. Connect to your database ────────────────────────────
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="your_password",   # ← change this
    database="nursing_dashboard"
)

# ── 2. Pull historical data using your exact columns ───────
df = pd.read_sql("""
    SELECT 
        da.unit,
        da.submission_date,
        DAYOFWEEK(da.submission_date)   AS day_of_week,
        MONTH(da.submission_date)       AS month,
        DAYOFMONTH(da.submission_date)  AS day_of_month,
        COUNT(da.nurse_id)              AS nurse_count,
        rr.ratio_value,
        rr.safe_limit,
        CASE 
            WHEN COUNT(da.nurse_id) < rr.safe_limit 
            THEN 1 ELSE 0 
        END AS was_understaffed
    FROM Daily_assignment da
    JOIN Ratio_rule rr ON da.ratio_id = rr.ratio_id
    GROUP BY 
        da.unit,
        da.submission_date,
        rr.ratio_value,
        rr.safe_limit
""", conn)

print(f"✅ Loaded {len(df)} rows from database")
print(f"✅ Class balance:\n{df['was_understaffed'].value_counts()}")

# ── 3. Prepare features ────────────────────────────────────
features = [
    'day_of_week',
    'month',
    'day_of_month',
    'nurse_count',
    'ratio_value'
]

X = df[features]
y = df['was_understaffed']

# ── 4. Split into train and test sets ──────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42
)

# ── 5. Train the model ─────────────────────────────────────
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)
model.fit(X_train, y_train)

# ── 6. Evaluate the model ──────────────────────────────────
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"\n✅ Model accuracy: {accuracy * 100:.1f}%")
print("\n✅ Classification Report:")
print(classification_report(y_test, y_pred,
      target_names=['Normal', 'Understaffed']))

# ── 7. Predict for a specific unit and date ────────────────
# Usage: python predict_staffing.py "ICU" "2026-07-01"

if len(sys.argv) == 3:
    unit = sys.argv[1]
    date = sys.argv[2]

    # Get that unit's ratio rule
    rule = pd.read_sql(f"""
        SELECT ratio_value, safe_limit
        FROM Ratio_rule
        WHERE unit = '{unit}'
        LIMIT 1
    """, conn)

    if rule.empty:
        print(json.dumps({
            "error": f"Unit '{unit}' not found in Ratio_rule"
        }))
        sys.exit(1)

    # Get how many nurses are assigned on that date
    assigned = pd.read_sql(f"""
        SELECT COUNT(da.nurse_id) AS nurse_count
        FROM Daily_assignment da
        JOIN Nursing_staff ns ON da.nurse_id = ns.nurse_id
        WHERE da.unit        = '{unit}'
          AND da.submission_date = '{date}'
          AND ns.status      = 'Active'
    """, conn)

    import datetime
    d             = datetime.datetime.strptime(date, "%Y-%m-%d")
    day_of_week   = d.isoweekday()
    month         = d.month
    day_of_month  = d.day
    nurse_count   = int(assigned['nurse_count'].iloc[0])
    ratio_value   = float(rule['ratio_value'].iloc[0])
    safe_limit    = int(rule['safe_limit'].iloc[0])

    prediction_input = pd.DataFrame([{
        'day_of_week':  day_of_week,
        'month':        month,
        'day_of_month': day_of_month,
        'nurse_count':  nurse_count,
        'ratio_value':  ratio_value
    }])

    probability = model.predict_proba(prediction_input)[0][1]
    risk_level  = (
        "HIGH"   if probability > 0.7 else
        "MEDIUM" if probability > 0.4 else
        "LOW"
    )

    result = {
        "unit":        unit,
        "date":        date,
        "probability": round(probability * 100, 1),
        "risk_level":  risk_level,
        "nurse_count": nurse_count,
        "safe_limit":  safe_limit,
        "message":     (
            f"⚠️ HIGH risk: {unit} is likely understaffed on {date}"
            if risk_level == "HIGH" else
            f"⚠️ MEDIUM risk: Monitor {unit} staffing on {date}"
            if risk_level == "MEDIUM" else
            f"✅ Staffing looks normal for {unit} on {date}"
        )
    }

    print("\n── Prediction Result ──────────────────────")
    print(json.dumps(result, indent=2))

else:
    # No arguments → predict for ALL units tomorrow
    import datetime
    tomorrow     = datetime.date.today() + datetime.timedelta(days=1)
    date         = str(tomorrow)
    day_of_week  = tomorrow.isoweekday()
    month        = tomorrow.month
    day_of_month = tomorrow.day

    print("\n── Predictions for Tomorrow ───────────────")

    units = pd.read_sql(
        "SELECT DISTINCT unit FROM Ratio_rule", conn
    )

    for _, row in units.iterrows():
        unit = row['unit']

        rule = pd.read_sql(f"""
            SELECT ratio_value, safe_limit
            FROM Ratio_rule
            WHERE unit = '{unit}'
            LIMIT 1
        """, conn)

        assigned = pd.read_sql(f"""
            SELECT COUNT(da.nurse_id) AS nurse_count
            FROM Daily_assignment da
            JOIN Nursing_staff ns ON da.nurse_id = ns.nurse_id
            WHERE da.unit             = '{unit}'
              AND da.submission_date  = '{date}'
              AND ns.status           = 'Active'
        """, conn)

        nurse_count  = int(assigned['nurse_count'].iloc[0])
        ratio_value  = float(rule['ratio_value'].iloc[0])
        safe_limit   = int(rule['safe_limit'].iloc[0])

        prediction_input = pd.DataFrame([{
            'day_of_week':  day_of_week,
            'month':        month,
            'day_of_month': day_of_month,
            'nurse_count':  nurse_count,
            'ratio_value':  ratio_value
        }])

        probability = model.predict_proba(prediction_input)[0][1]
        risk_level  = (
            "HIGH"   if probability > 0.7 else
            "MEDIUM" if probability > 0.4 else
            "LOW"
        )

        icon = "🔴" if risk_level == "HIGH" else \
               "🟡" if risk_level == "MEDIUM" else "🟢"

        print(f"{icon} {unit:<15} "
              f"Risk: {risk_level:<8} "
              f"({probability*100:.1f}%) "
              f"Nurses: {nurse_count}/{safe_limit}")

conn.close()