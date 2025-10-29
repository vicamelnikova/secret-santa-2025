import { useState, useEffect } from 'react';
import RegistrationPage from './components/RegistrationPage';
import AdminDashboard from './components/AdminDashboard';
import Snowfall from './components/Snowfall';

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'admin'>('home');

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/admin') {
      setCurrentPage('admin');
    } else {
      setCurrentPage('home');
    }

    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentPage(path === '/admin' ? 'admin' : 'home');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const links = document.querySelectorAll('a[href^="/"]');
    const handleClick = (e: Event) => {
      e.preventDefault();
      const href = (e.currentTarget as HTMLAnchorElement).getAttribute('href');
      if (href) {
        window.history.pushState({}, '', href);
        setCurrentPage(href === '/admin' ? 'admin' : 'home');
      }
    };

    links.forEach(link => link.addEventListener('click', handleClick));
    return () => links.forEach(link => link.removeEventListener('click', handleClick));
  });

  return (
    <>
      <Snowfall />
      <div className="relative z-10">
        {currentPage === 'admin' ? <AdminDashboard /> : <RegistrationPage />}
      </div>
    </>
  );
}

export default App;
