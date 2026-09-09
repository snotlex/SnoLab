import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from "./services/localization";
import { ProjectProvider } from "./services/storage/ProjectContext";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <ProjectProvider>
        <App />
      </ProjectProvider>
    </LanguageProvider>
  </StrictMode>,
);
