import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import LoginPage from '../features/auth/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import { ProtectedRoute } from './ProtectedRoute'
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
  { path: '*', element: <Navigate to="/login" replace /> },
]

export const createAppRouter = () => createBrowserRouter(routes)
