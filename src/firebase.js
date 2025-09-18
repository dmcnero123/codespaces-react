// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuración que copiaste de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA5SfpmXspUdL0RH-jFII-vVlZamSvFOtw",
  authDomain: "prueba1-d9894.firebaseapp.com",
  projectId: "prueba1-d9894",
  storageBucket: "prueba1-d9894.firebasestorage.app",
  messagingSenderId: "548168869497",
  appId: "1:548168869497:web:4c3695019643b3db4f56a8",
  measurementId: "G-JCK56JH8D4"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar la BD de Firestore
export const db = getFirestore(app);
