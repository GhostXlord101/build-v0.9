import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Menu,
  X,
  Home,
  Users,
  FileText,
  BarChart2,
  Settings as SettingsIcon,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';

// Example notification counts (replace with real data from context or props)
const notifications = {
  leads: 5,
  contacts: 2,
};

// Navigation items structure with optional submenus
const navItems = [
  {
    name: 'Dashboard',
    to: '/',
    icon: Home,
  },
  {
    name: 'Leads',
    to: '/leads',
    icon: Users,
    countKey: 'leads', // key in notifications object for badge
  },
  {
    name: 'Contacts',
    to: '/contacts',
    icon: FileText,
    countKey: 'contacts',
  },
  {
    name: 'Analytics',
    to: '/analytics',
    icon: BarChart2,
  },
  {
    name: 'Settings',
    to: '/settings',
    icon: SettingsIcon,
    // Example nested submenu (uncomment if you want sub-items)
    // subItems: [
    //   { name: 'User Settings', to: '/settings/users' },
    //   { name: 'App Settings', to: '/settings/app' },
    // ],
  },
];

const Sidebar = () => {
  const { currentUser } = useUser();
  const [collapsed, setCollapsed] = useState(false);
  // Track which nav item submenu is open (if submenus exist)
  const [submenuOpen, setSubmenuOpen] = useState(null);

  // Toggle sidebar collapse (for narrow viewports or manual toggle)
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  // Toggle submenu open/close by index
  const toggleSubmenu = (index) => {
    setSubmenuOpen(submenuOpen === index ? null : index);
  };

  // Render navigation link (with optional submenu)
  const renderNavItem = (item, index) => {
    const Icon = item.icon;
    const badgeCount = item.countKey ? notifications[item.countKey] : 0;
    const hasSubmenu = item.subItems && item.subItems.length > 0;

    return (
      <li key={item.name} className="relative">
        {/* Main Nav Link */}
        <NavLink
          to={item.to}
          end={item.to === '/'} // exact matching for dashboard '/'
          className={({ isActive }) =>
            `flex items-center justify-between gap-3 rounded-md px-4 py-3 transition-colors
            ${
              isActive
                ? 'bg-brand-violet text-white font-semibold shadow-lg'
                : 'hover:bg-brand-violetDark hover:text-white text-brand-accent'
            }`
          }
          aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
          onClick={() => {
            if (hasSubmenu) toggleSubmenu(index);
          }}
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="truncate max-w-[12rem]">{item.name}</span>
          </div>

          <div className="flex items-center gap-2">
            {badgeCount > 0 && (
              <span
                aria-label={`${badgeCount} new ${item.name.toLowerCase()}`}
                className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-red-600 text-white text-xs font-semibold min-w-[1.3rem] h-5 select-none"
              >
                {badgeCount}
              </span>
            )}

            {hasSubmenu && (
              <span aria-hidden="true" className="ml-1">
                {submenuOpen === index ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </span>
            )}
          </div>
        </NavLink>

        {/* Render submenu if present and open */}
        {hasSubmenu && submenuOpen === index && (
          <ul className="ml-10 mt-1 space-y-1">
            {item.subItems.map((subitem) => (
              <li key={subitem.name}>
                <NavLink
                  to={subitem.to}
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-brand-violet text-white font-semibold shadow'
                        : 'hover:bg-brand-violetDark hover:text-white text-brand-accent'
                    }`
                  }
                  aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
                >
                  {subitem.name}
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <>
      {/* Sidebar container */}
      <aside
        className={`flex flex-col bg-brand-surface text-brand-accent border-r border-brand-violetDark select-none
          transition-width duration-300 ease-in-out
          ${collapsed ? 'w-16' : 'w-64'}
        `}
        aria-label="Primary Navigation"
      >
        {/* Sidebar header: brand + collapse toggle */}
        <div
          className={`flex items-center justify-between px-4 py-4 border-b border-brand-violetDark ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          {!collapsed && (
            <div className="text-2xl font-black text-brand-violet truncate select-text" title="My CRM">
              My CRM
            </div>
          )}
          <button
            onClick={toggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-2 rounded hover:bg-brand-violetDark focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-violet"
          >
            {collapsed ? <Menu className="w-6 h-6" /> : <X className="w-6 h-6" />}
          </button>
        </div>

        {/* User profile section, only shown when not collapsed */}
        {!collapsed && currentUser && (
          <div className="flex items-center gap-3 p-4 border-b border-brand-violetDark">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=8b5cf6&color=fff&size=48`}
              alt={`${currentUser.name} avatar`}
              className="w-12 h-12 rounded-full border-2 border-brand-violet shadow-sm"
            />
            <div>
              <p className="font-semibold text-white truncate">{currentUser.name}</p>
              <p className="text-xs text-brand-accent truncate">{currentUser.email}</p>
            </div>
          </div>
        )}

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-1 py-4">
          <ul className="space-y-1">{navItems.map(renderNavItem)}</ul>
        </nav>

        {/* Footer - optional */}
        {!collapsed && (
          <footer className="px-4 py-3 border-t border-brand-violetDark text-xs text-brand-accent text-center select-none">
            &copy; {new Date().getFullYear()} My Company
          </footer>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
