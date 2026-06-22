import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { readMainapHandoffSession } from './lib/mainapHandoff'
import './styles.css'

const mainapHandoffSession = readMainapHandoffSession()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App
        embedded={Boolean(mainapHandoffSession)}
        embeddedActorName={mainapHandoffSession?.actorName}
        embeddedUserEmail={mainapHandoffSession?.actorEmail}
        embeddedUserRole={mainapHandoffSession?.actorRole}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
