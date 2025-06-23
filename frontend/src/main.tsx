import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import QuestionsPage from './pages/QuestionsPage';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/questions" element={<QuestionsPage />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  </React.StrictMode>,
)
