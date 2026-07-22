import { useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { createAppRouter } from './routes'

/** Monta el router del navegador (SPA, sin SSR). */
export function AppRouter() {
  // Se crea una sola vez por montaje, fuera del ciclo de render.
  const [router] = useState(createAppRouter)
  return <RouterProvider router={router} />
}
