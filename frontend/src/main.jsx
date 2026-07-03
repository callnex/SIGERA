import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles/app.css";
import { AuthProvider, useAuth } from "./api/auth.jsx";
import AppLayout from "./components/AppLayout.jsx";
import AdopterLayout from "./components/AdopterLayout.jsx";
import PublicLayout from "./components/PublicLayout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Services from "./pages/Services.jsx";
import Contact from "./pages/Contact.jsx";
import PasswordReset from "./pages/PasswordReset.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Animals from "./pages/Animals.jsx";
import AnimalForm from "./pages/AnimalForm.jsx";
import AnimalRecord from "./pages/AnimalRecord.jsx";
import MedicalRecords from "./pages/MedicalRecords.jsx";
import Inventory from "./pages/Inventory.jsx";
import Adoptions from "./pages/Adoptions.jsx";
import Adopters from "./pages/Adopters.jsx";
import Users from "./pages/Users.jsx";
import Reports from "./pages/Reports.jsx";
import Profile from "./pages/Profile.jsx";
import ShelterSettings from "./pages/ShelterSettings.jsx";
import Locations from "./pages/Locations.jsx";
import Tasks from "./pages/Tasks.jsx";
import AuditLog from "./pages/AuditLog.jsx";
import Home from "./pages/Home.jsx";
import Catalog from "./pages/Catalog.jsx";
import PublicAnimalDetail from "./pages/PublicAnimalDetail.jsx";
import AdoptionForm from "./pages/AdoptionForm.jsx";
import AdopterDashboard from "./pages/AdopterDashboard.jsx";
import AdopterTracking from "./pages/AdopterTracking.jsx";
import AdopterProfile from "./pages/AdopterProfile.jsx";

const STAFF_ROLES = ["admin", "vet", "volunteer"];
const ADOPTER_ROLES = ["adopter"];

function Protected({ children, roles, fallback = "/admin" }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (!user) return <main className="auth-loading">Validando tus credenciales...</main>;
  if (roles && !roles.includes(user.profile?.role)) return <Navigate to={fallback} replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/catalogo" element={<Catalog />} />
            <Route path="/catalogo/:id" element={<PublicAnimalDetail />} />
            <Route path="/catalogo/:id/solicitud" element={<AdoptionForm />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/servicios" element={<Services />} />
            <Route path="/contacto" element={<Contact />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/restablecer-contrasena/:uid/:token" element={<PasswordReset />} />
          <Route
            path="/adoptante"
            element={
              <Protected roles={ADOPTER_ROLES} fallback="/catalogo">
                <AdopterLayout />
              </Protected>
            }
          >
            <Route index element={<Protected roles={ADOPTER_ROLES} fallback="/catalogo"><AdopterDashboard /></Protected>} />
            <Route path="seguimiento" element={<Protected roles={ADOPTER_ROLES} fallback="/catalogo"><AdopterTracking /></Protected>} />
            <Route path="perfil" element={<Protected roles={ADOPTER_ROLES} fallback="/catalogo"><AdopterProfile /></Protected>} />
          </Route>
          <Route
            path="/admin"
            element={
              <Protected roles={STAFF_ROLES} fallback="/catalogo">
                <AppLayout />
              </Protected>
            }
          >
            <Route index element={<Protected roles={STAFF_ROLES}><Dashboard /></Protected>} />
            <Route path="perfil" element={<Protected roles={STAFF_ROLES}><Profile /></Protected>} />
            <Route path="animales" element={<Protected roles={STAFF_ROLES}><Animals /></Protected>} />
            <Route path="animales/nuevo" element={<Protected roles={["admin", "vet"]}><AnimalForm /></Protected>} />
            <Route path="animales/:id" element={<Protected roles={STAFF_ROLES}><AnimalRecord /></Protected>} />
            <Route path="animales/:id/editar" element={<Protected roles={["admin", "vet"]}><AnimalForm /></Protected>} />
            <Route path="medico" element={<Protected roles={["admin", "vet"]}><MedicalRecords /></Protected>} />
            <Route path="inventario" element={<Protected roles={STAFF_ROLES}><Inventory /></Protected>} />
            <Route path="adopciones" element={<Protected roles={["admin", "volunteer"]}><Adoptions /></Protected>} />
            <Route path="adoptantes" element={<Protected roles={["admin", "volunteer"]}><Adopters /></Protected>} />
            <Route path="tareas" element={<Protected roles={STAFF_ROLES}><Tasks /></Protected>} />
            <Route path="usuarios" element={<Protected roles={["admin"]}><Users /></Protected>} />
            <Route path="ubicaciones" element={<Protected roles={["admin"]}><Locations /></Protected>} />
            <Route path="configuracion" element={<Protected roles={["admin"]}><ShelterSettings /></Protected>} />
            <Route path="auditoria" element={<Protected roles={["admin"]}><AuditLog /></Protected>} />
            <Route path="reportes" element={<Protected roles={STAFF_ROLES}><Reports /></Protected>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

createRoot(document.getElementById("root")).render(<App />);
