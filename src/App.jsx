import "./App.css";
import { useEffect, useMemo, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart
} from "recharts";

// Si usas proxy en Vite (vite.config.js), deja solo "/predict"
const PREDICT_URL = "/predict";

const nf0 = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 });

export default function App() {
  const [ventas, setVentas] = useState([]);
  const [preds, setPreds] = useState([]);
  const [loadingPred, setLoadingPred] = useState(false);
  const [predError, setPredError] = useState("");

  // 1) Datos desde Firestore
  useEffect(() => {
    (async () => {
      const q = query(collection(db, "ventas"), orderBy("fecha", "asc"));
      const snap = await getDocs(q);
      const rows = snap.docs.map((d) => d.data());
      setVentas(rows);
    })();
  }, []);

  // 2) Predicción backend
  useEffect(() => {
    (async () => {
      if (!ventas.length) return;
      setPredError("");
      setLoadingPred(true);
      try {
        const res = await axios.post(PREDICT_URL, ventas, { timeout: 10000 });
        setPreds(res.data.predicciones || []);
      } catch (e) {
        setPreds([]);
        setPredError("No se pudo obtener predicciones (verifica backend/proxy).");
      } finally {
        setLoadingPred(false);
      }
    })();
  }, [ventas]);

  // 3) Unificar series para el chart
  const data = useMemo(() => {
    const map = new Map();
    ventas.forEach(v => map.set(v.fecha, { fecha: v.fecha, real: Number(v.ventas) }));
    preds.forEach(p => {
      const curr = map.get(p.fecha) || { fecha: p.fecha };
      curr.pred = Number(p.ventas);
      map.set(p.fecha, curr);
    });
    return Array.from(map.values()).sort((a,b) => a.fecha.localeCompare(b.fecha));
  }, [ventas, preds]);

  // KPIs
  const { total, promedio, max, min, tendencia } = useMemo(() => {
    if (!ventas.length) return { total: 0, promedio: 0, max: 0, min: 0, tendencia: 0 };
    const nums = ventas.map(v => Number(v.ventas));
    const sum = nums.reduce((a,b) => a+b, 0);
    const prom = sum / nums.length;
    const mx = Math.max(...nums);
    const mn = Math.min(...nums);
    const trend = nums.length > 1 ? ((nums.at(-1) - nums[0]) / Math.max(1, nums[0])) * 100 : 0;
    return { total: sum, promedio: prom, max: mx, min: mn, tendencia: trend };
  }, [ventas]);

  return (
    <div className="container">
      <h1 className="h1">📊 Dashboard de Ventas</h1>

      {/* KPIs */}
      <div className="kpis">
        <div className="card">
          <div className="kpi-title">Total periodo</div>
          <div className="kpi-value">{nf0.format(total)}</div>
        </div>
        <div className="card">
          <div className="kpi-title">Promedio diario</div>
          <div className="kpi-value">{nf1.format(promedio)}</div>
        </div>
        <div className="card">
          <div className="kpi-title">Máximo</div>
          <div className="kpi-value">{nf0.format(max)}</div>
        </div>
        <div className="card">
          <div className="kpi-title">Mínimo</div>
          <div className="kpi-value">{nf0.format(min)}</div>
        </div>
        <div className="card">
          <div className="kpi-title">Tendencia (↑ primero → último)</div>
          <div className="kpi-value">{nf1.format(tendencia)}%</div>
        </div>
      </div>

      {/* Gráfico principal */}
      <div className="card chart-card">
        <div className="section-title">Serie histórica y predicción</div>
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="real" name="Ventas reales" dot={false} />
            <Line type="monotone" dataKey="pred" name="Predicción (7 días)" dot={false} strokeDasharray="6 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Mini área de tendencia (spark)**/}
      <div className="card chart-card" style={{ marginTop: 16 }}>
        <div className="section-title">Mini-tendencia (últimos valores)</div>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={ventas}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopOpacity={0.35}/>
                <stop offset="95%" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="fecha" hide />
            <YAxis hide />
            <Area type="monotone" dataKey="ventas" fillOpacity={1} fill="url(#g1)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla de detalle */}
      <div className="section-title">Detalle</div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th className="td-right">Real</th>
              <th className="td-right">Predicción</th>
            </tr>
          </thead>
          <tbody>
            {data.map(r => (
              <tr key={r.fecha}>
                <td>{r.fecha}</td>
                <td className="td-right">{r.real != null ? nf0.format(r.real) : "–"}</td>
                <td className="td-right">{r.pred != null ? nf1.format(r.pred) : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Predicciones futuras como pills */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="section-title">
          Próximos 7 días {loadingPred ? " (calculando…)" : ""}
        </div>
        {predError ? (
          <div style={{ color: "#b45309" }}>{predError}</div>
        ) : (
          <div className="pills">
            {preds.map(p => (
              <span className="pill" key={p.fecha}>
                {p.fecha}: {nf1.format(p.ventas)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
