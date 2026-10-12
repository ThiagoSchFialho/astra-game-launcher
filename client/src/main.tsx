import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { RunningGameProvider } from './context/RunningGameContext'
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RunningGameProvider>
      <App />
    </RunningGameProvider>
  </StrictMode>,
)