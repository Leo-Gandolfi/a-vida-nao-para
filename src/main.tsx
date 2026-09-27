import React from 'react';
import { createRoot } from 'react-dom/client';
import Cinema from './components/Cinema';
import './styles.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><Cinema /></React.StrictMode>);
