import "@fontsource-variable/fraunces/full.css"
import "@fontsource/poppins/latin-400.css"
import "@fontsource/poppins/latin-500.css"
import "@fontsource/poppins/latin-600.css"
import "@fontsource/poppins/latin-700.css"

import { QueryClientProvider } from "@tanstack/react-query"
import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { Toaster } from "sonner"

import "@/i18n"
import "@/index.css"

import App from "@/App"
import { queryClient } from "@/lib/queryClient"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          richColors
          closeButton
          offset={76}
          toastOptions={{ className: "font-sans" }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
