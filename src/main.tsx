import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from "./services/localization";
import { ProjectProvider } from "./services/storage/ProjectContext";
import { ProjectWorkflowProvider } from "./services/workflow/ProjectWorkflowController";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <ProjectProvider>
        <ProjectWorkflowProvider>
          <App />
        </ProjectWorkflowProvider>
      </ProjectProvider>
    </LanguageProvider>
  </StrictMode>,
);
