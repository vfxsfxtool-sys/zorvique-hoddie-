import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ExternalLink,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Navigation,
  Package,
  RefreshCw,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAdminData } from '../context/AdminDataContext';
import { resolveStorefrontUrl } from '../utils/adminLogic';

const NAV_ITEMS = [
  { to: '/', label: 'Home / Overview', icon: LayoutDashboard, end: true },
  { to: '/orders', label: 'Orders (PKR)', icon: ShoppingBag },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/collections', label: 'Collections', icon: FolderKanban },
  { to: '/customers', label: 'Customers', icon: UserCheck },
  { to: '/discounts', label: 'Discounts', icon: Tag },
  { to: '/hero-homepage', label: 'Online Store & Hero', icon: Sparkles },
  { to: '/navigation', label: 'Navigation & Socials', icon: Navigation },
  { to: '/pages', label: 'Pages', icon: FileText },
  { to: '/media', label: 'Media Library', icon: ImageIcon },
  { to: '/subscribers', label: 'Subscribers', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout() {
  const { user, isOwner, logout } = useAuth();
  const { loading, error, orders, refreshAll } = useAdminData();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const storefrontUrl = typeof window !== 'undefined' ? resolveStorefrontUrl(window.location) : '/';

  const newOrdersCount = orders.filter((o) => o.status === 'new').length;
  const activeTitle =
    NAV_ITEMS.find((item) =>
      item.end ? location.pathname === '/' : location.pathname.startsWith(item.to)
    )?.label || 'Admin Console';

  const SidebarLinks = (
    <nav aria-label="Admin Navigation" className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const showOrderCount = item.to === '/orders' && newOrdersCount > 0;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setDrawerOpen(false)}
            className={({ isActive }) =>
              `flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#FF7A00] text-[#121212] font-semibold'
                  : 'text-[#E0C0AF] hover:text-white hover:bg-white/[0.06]'
              }`
            }
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </span>
            {showOrderCount && (
              <span className="text-[11px] font-mono tabular-nums opacity-85">
                {newOrdersCount} new
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#121212] text-[#E4E2E1] flex">
      {/* Desktop Sidebar */}
      <aside className="no-print hidden lg:flex w-64 shrink-0 bg-[#181818] border-r border-white/[0.06] flex-col sticky top-0 h-screen">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#FF7A00] text-[#121212] font-display font-bold text-xs flex items-center justify-center">
              Z
            </span>
            <div>
              <p className="font-display text-sm font-semibold text-white tracking-wider">ZORVIQUE</p>
              <p className="text-[11px] text-[#E0C0AF]">Store Console</p>
            </div>
          </div>
          <a
            href={storefrontUrl}
            aria-label="Open live storefront"
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-[#E0C0AF] hover:text-white flex items-center justify-center transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {SidebarLinks}

        <div className="p-4 border-t border-white/[0.06] space-y-3">
          <div className="px-1">
            <p className="text-xs font-medium text-white truncate">{user?.email}</p>
            <p className={`text-[11px] font-medium ${isOwner ? 'text-[#FF7A00]' : 'text-[#E0C0AF]'}`}>
              {isOwner ? 'Store Admin (Owner)' : 'Team Member'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={storefrontUrl}
              className="min-h-[42px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#FF7A00]/15 hover:bg-[#FF7A00]/25 border border-[#FF7A00]/30 text-xs font-semibold text-[#F5B082] hover:text-white transition-colors whitespace-nowrap"
            >
              <Store className="w-3.5 h-3.5 shrink-0" />
              <span>Storefront</span>
            </a>
            <button
              type="button"
              onClick={() => void logout()}
              className="min-h-[42px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-[#E4E2E1] cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="no-print sticky top-0 z-30 bg-[#121212]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden w-11 h-11 rounded-xl bg-[#1F2020] border border-white/10 flex items-center justify-center text-white cursor-pointer shrink-0"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] text-[#E0C0AF] truncate">
                Zorvique / {activeTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href={storefrontUrl}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1F2020] border border-white/10 text-xs font-medium text-[#E0C0AF] hover:text-white hover:bg-white/10 whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Store</span>
            </a>
            <button
              type="button"
              onClick={() => void refreshAll()}
              disabled={loading}
              aria-label="Refresh Firestore data"
              className="min-h-[38px] inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1F2020] border border-white/10 text-xs font-medium text-white hover:bg-white/10 disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 pb-24 lg:pb-10 max-w-7xl w-full mx-auto">
          {error && (
            <div role="alert" className="mb-6 rounded-2xl bg-red-500/15 border border-red-500/30 p-4 text-sm text-red-200">
              {error}
            </div>
          )}
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden bg-black/75 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Admin Navigation Drawer"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="w-72 max-w-[85vw] h-full bg-[#181818] border-r border-white/10 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <span className="font-display font-semibold text-white">ZORVIQUE ADMIN</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation menu"
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {SidebarLinks}
            <div className="p-4 border-t border-white/10 grid grid-cols-2 gap-2">
              <a
                href={storefrontUrl}
                className="min-h-[42px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#FF7A00]/15 border border-[#FF7A00]/30 text-xs font-semibold text-[#F5B082]"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Storefront</span>
              </a>
              <button
                type="button"
                onClick={() => void logout()}
                className="min-h-[42px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/5 text-xs font-medium text-white cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Quick Bottom Bar */}
      <nav
        aria-label="Mobile Quick Navigation"
        className="no-print lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[#181818]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 flex items-center justify-around"
      >
        {[
          { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
          { to: '/orders', label: 'Orders', icon: ShoppingBag },
          { to: '/products', label: 'Products', icon: Package },
          { to: '/customers', label: 'Customers', icon: UserCheck },
          { to: '/settings', label: 'Settings', icon: Settings },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium ${
                  isActive ? 'text-[#FF7A00]' : 'text-[#E0C0AF]'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
