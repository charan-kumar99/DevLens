import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Compare from './pages/Compare';
import Discover from './pages/Discover';
import GlobalAIChat from './components/GlobalAIChat';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <GlobalAIChat />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
