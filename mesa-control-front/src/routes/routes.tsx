import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import LoginPage from '../features/auth/LoginPage'
import AnalisisMensualPage from '../features/dashboard/AnalisisMensualPage'
import NuevaGestionPage from '../features/registro/NuevaGestionPage'
import DashboardPage from '../pages/DashboardPage'
import FibexPlayPage from '../pages/FibexPlayPage'
import FibexPlayGestionPage from '../pages/FibexPlayGestionPage'
import HistorialPage from '../pages/HistorialPage'
import AdminPage from '../pages/AdminPage'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleRoute } from './RoleRoute'
import { RootRedirect } from './RootRedirect'

/** Rutas de la SPA; exportadas para poder montarlas en un memory router. */
export const routes: RouteObject[] = [
  { path: '/', element: <RootRedirect /> },
  { path: '/login', element: <LoginPage /> },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/analisis-mensual',
    element: (
      <ProtectedRoute>
        <AnalisisMensualPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/registro',
    element: (
      <ProtectedRoute>
        <NuevaGestionPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/historial',
    element: (
      <ProtectedRoute>
        <HistorialPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/fibex-play',
    element: (
      <ProtectedRoute>
        <FibexPlayPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/fibex-play/gestion',
    element: (
      <ProtectedRoute>
        <FibexPlayGestionPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <RoleRoute roles={['ADMIN', 'SUPERVISOR']}>
          <AdminPage />
        </RoleRoute>
      </ProtectedRoute>
    ),
  },
  { path: '*', element: <Navigate to="/login" replace /> },
]

export const createAppRouter = () => createBrowserRouter(routes)
