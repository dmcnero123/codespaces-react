import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

const ventas = [
  { fecha: "2025-09-01", ventas: 120 },
  { fecha: "2025-09-02", ventas: 150 },
  { fecha: "2025-09-03", ventas: 90 },
  { fecha: "2025-09-04", ventas: 180 },
  { fecha: "2025-09-05", ventas: 200 },
  { fecha: "2025-09-06", ventas: 170 },
  { fecha: "2025-09-07", ventas: 210 },
  { fecha: "2025-09-08", ventas: 95 },
  { fecha: "2025-09-09", ventas: 130 },
  { fecha: "2025-09-10", ventas: 175 },
];

async function seedData() {
  for (let v of ventas) {
    await addDoc(collection(db, "ventas"), v);
    console.log("Agregado:", v);
  }
  console.log("✅ Datos cargados en Firestore");
}

seedData();
