import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart3, Store, CreditCard, History,
  Settings, LogOut, ShieldCheck, ChevronRight, MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './SuperAdminLayout.css';

const SuperAdminLayout = () => {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: <BarChart3 size={20} />, label: 'Visão Geral',          path: '/' },
    { icon: <Store size={20} />,    label: 'Restaurantes',           path: '/restaurantes' },
    { icon: <CreditCard size={20} />, label: 'Planos & Assinaturas', path: '/planos' },
    { icon: <History size={20} />,  label: 'Logs de Auditoria',      path: '/audit' },
    { icon: <MessageSquare size={20} />, label: 'Feedback',          path: '/feedback' },
    { icon: <Settings size={20} />, label: 'Configurações Globais',  path: '/config' },
  ];

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div className="super-layout">
      <aside className="super-sidebar">
        <div className="super-sidebar-header">
          <div className="super-logo">
            <ShieldCheck className="super-logo-icon" />
            <span>Pedi&Recebe <small>SuperAdmin</small></span>
          </div>
        </div>

        <nav className="super-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`super-nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
              {isActive(item.path) && <ChevronRight size={16} className="active-indicator" />}
            </Link>
          ))}
        </nav>

        <div className="super-sidebar-footer">
          <div className="super-user-info">
            <div className="super-user-avatar">
              {profile?.nome?.charAt(0) || 'S'}
            </div>
            <div className="super-user-details">
              <p className="super-user-name">{profile?.nome || 'Super Admin'}</p>
              <p className="super-user-role">Administrador Global</p>
            </div>
          </div>
          <button onClick={handleLogout} className="super-logout-btn">
            <LogOut size={18} />
            <span>Sair do Painel</span>
          </button>
        </div>
      </aside>

      <main className="super-main">
        <header className="super-main-header">
          <div className="header-blur-bg"></div>
          <div className="header-left relative z-10">
            <h2 className="header-title">
              {menuItems.find(i => isActive(i.path))?.label || 'Painel de Controle'}
            </h2>
          </div>
        </header>
        <div className="super-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SuperAdminLayout;
