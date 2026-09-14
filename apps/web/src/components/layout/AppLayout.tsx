import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CalendarClock,
  FolderArchive,
  Users2,
  Building2,
  Briefcase,
  MapPin,
  ShieldCheck,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Sparkles,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Planning Tomorrow', path: '/planning', icon: CalendarClock },
    { label: 'Records', path: '/records', icon: FolderArchive },
    { label: 'Clients', path: '/clients', icon: Users2 },
    { label: 'Departments', path: '/departments', icon: Building2 },
    { label: 'Jobs', path: '/jobs', icon: Briefcase },
    { label: 'Areas', path: '/areas', icon: MapPin },
    { label: 'Users & Roles', path: '/users', icon: ShieldCheck, requiredPerm: 'users:manage' },
    { label: 'History', path: '/history', icon: History },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (!item.requiredPerm) return true;
    return user?.permissions.includes(item.requiredPerm) || user?.role?.name === 'Admin';
  });

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {/* Desktop & Laptop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 xl:w-72 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 select-none">
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950/60">
          <div className="h-9 w-9 rounded-lg bg-yellow-400 flex items-center justify-center font-black text-slate-950 text-xl tracking-wider shadow-sm">
            EC
          </div>
          <div>
            <span className="text-base font-bold text-white tracking-tight">Euro Choice</span>
            <span className="block text-[10px] text-yellow-400 font-medium uppercase tracking-wider">
              Management SaaS
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive: exactActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    exactActive || isActive
                      ? 'bg-yellow-400 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-full bg-slate-700 text-yellow-400 flex items-center justify-center font-bold text-xs uppercase border border-yellow-400/20">
                {user?.name.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <span className="text-[10px] text-slate-400 block truncate">{user?.role?.name || 'User'}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-slate-900 text-slate-300 flex flex-col z-50 border-r border-slate-800 shadow-2xl">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-yellow-400 flex items-center justify-center font-bold text-slate-950 text-base">
                  EC
                </div>
                <span className="text-base font-bold text-white">Euro Choice</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium ${
                        isActive
                          ? 'bg-yellow-400 text-slate-950 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 w-full px-2 py-1.5"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 border border-yellow-300">
                Production SaaS
              </span>
              <span className="text-xs text-slate-400 font-mono">v1.0.0</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Backend Connected (127.0.0.1:5000)</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200">
              {user?.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation Bar (<768px) */}
        <div className="fixed bottom-0 inset-x-0 bg-slate-900 border-t border-slate-800 z-40 flex md:hidden items-center justify-around h-14 px-2">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center text-[10px] ${
                isActive ? 'text-yellow-400 font-semibold' : 'text-slate-400'
              }`
            }
          >
            <LayoutDashboard className="h-4 w-4 mb-0.5" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/planning"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center text-[10px] ${
                isActive ? 'text-yellow-400 font-semibold' : 'text-slate-400'
              }`
            }
          >
            <CalendarClock className="h-4 w-4 mb-0.5" />
            <span>Planning</span>
          </NavLink>
          <NavLink
            to="/records"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center text-[10px] ${
                isActive ? 'text-yellow-400 font-semibold' : 'text-slate-400'
              }`
            }
          >
            <FolderArchive className="h-4 w-4 mb-0.5" />
            <span>Records</span>
          </NavLink>
          <NavLink
            to="/clients"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center text-[10px] ${
                isActive ? 'text-yellow-400 font-semibold' : 'text-slate-400'
              }`
            }
          >
            <Users2 className="h-4 w-4 mb-0.5" />
            <span>Clients</span>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center text-[10px] ${
                isActive ? 'text-yellow-400 font-semibold' : 'text-slate-400'
              }`
            }
          >
            <Settings className="h-4 w-4 mb-0.5" />
            <span>Settings</span>
          </NavLink>
        </div>
      </div>
    </div>
  );
};
