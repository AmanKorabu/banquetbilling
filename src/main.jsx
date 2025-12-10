import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "@fontsource/poppins";          // Defaults to weight 400
import "@fontsource/poppins/500.css";  // Medium
import "@fontsource/poppins/700.css";  // Bold
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
