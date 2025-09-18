from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from sklearn.linear_model import LinearRegression

app = Flask(__name__)
CORS(app)

def next_dates(last_date_str, n=7):
    last = pd.to_datetime(last_date_str)
    return [(last + pd.Timedelta(days=i)).strftime("%Y-%m-%d") for i in range(1, n+1)]

@app.route("/predict", methods=["POST"])
def predict():
    """
    Espera un JSON como lista de objetos:
    [
      {"fecha": "2025-09-01", "ventas": 120},
      ...
    ]
    """
    data = request.get_json(force=True)
    if not isinstance(data, list) or len(data) < 2:
        return jsonify({"error": "Se requieren al menos 2 puntos de ventas"}), 400

    df = pd.DataFrame(data)
    if "fecha" not in df.columns or "ventas" not in df.columns:
        return jsonify({"error": "Campos requeridos: fecha, ventas"}), 400

    # ordenar por fecha
    df["fecha"] = pd.to_datetime(df["fecha"])
    df = df.sort_values("fecha")
    df["fecha_num"] = df["fecha"].map(pd.Timestamp.toordinal)
    X = df[["fecha_num"]]
    y = df["ventas"].astype(float)

    model = LinearRegression()
    model.fit(X, y)

    last_date = df["fecha"].max().strftime("%Y-%m-%d")
    future_dates = next_dates(last_date, n=7)
    future_ord = pd.Series(pd.to_datetime(future_dates).map(pd.Timestamp.toordinal), name="fecha_num").to_frame()

    yhat = model.predict(future_ord)

    preds = [{"fecha": d, "ventas": round(float(v), 2)} for d, v in zip(future_dates, yhat)]
    return jsonify({"predicciones": preds})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
