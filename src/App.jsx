import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ComparePage from './pages/ComparePage';
import ThemeToggle from './components/ThemeToggle';
import { ThemeProvider } from './theme';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <header className="app-header">
          <span className="brand">GitHub Analyzer</span>
          <nav>
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/compare">Compare</NavLink>
          </nav>
          <ThemeToggle />
        </header>
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/compare" element={<ComparePage />} />
          </Routes>
        </main>
      </Router>
    </ThemeProvider>
  );
}

export default App;
