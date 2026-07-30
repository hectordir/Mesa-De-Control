import { QueryClientProvider } from '@tanstack/react-query'
import { Analytics } from '@vercel/analytics/react'
import { queryClient } from './lib/queryClient'
import { AppRouter } from './routes/AppRouter'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      {/*
        Vercel Web Analytics: montaje ÚNICO por encima del router para cubrir
        todas las rutas (montarlo dos veces duplicaría las vistas). El script
        auto-registra los cambios de ruta del SPA. Solo reporta desde el deploy
        de Vercel; en local y en tests no envía datos.
      */}
      <Analytics />
    </QueryClientProvider>
  )
}

export default App
