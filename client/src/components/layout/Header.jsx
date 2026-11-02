import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  X
} from 'lucide-react';
import Logo from './Logo';
import LanguageSwitcher from './LanguageSwitcher';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import useOnClickOutside from '../../hooks/useOnClickOutside';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { homeForRole } from '../../utils/status';
import { cn } from '../../utils/cn';

const navLinkClass = ({ isActive }) =>
  cn(
    'relative py-2 text-sm font-semibold transition',
    isActive ? 'text-ink' : 'text-ink-soft hover:text-ink'
  );

export default function Header() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useOnClickOutside(menuRef, () => setMenuOpen(false));

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    setMobileOpen(false);
    toast.success(t('common.logout'));
    navigate('/');
  };

  const isOfficial = user && ['district_head', 'super_admin'].includes(user.role);
  const home = user ? homeForRole(user.role) : '/login';

  const publicLinks = [
    { to: '/', label: t('nav.home'), end: true },
    { to: '/#how', label: t('nav.how') },
    { to: '/#faq', label: t('nav.faq') },
    { to: '/portal', label: t('nav.portal') },
    { to: '/track', label: t('nav.track') }
  ];

  return (
    <header className="sticky top-0 z-50">
      <div className="h-1 bg-flag-stripe" />
      <div className="border-b border-ink/10 bg-white/90 backdrop-blur-xl">
        <div className="container-page flex h-[68px] items-center justify-between gap-4">
          <Logo />

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
            {publicLinks.map((link) =>
              link.to.includes('#') ? (
                <Link
                  key={link.to}
                  to={link.to}
                  className="py-2 text-sm font-semibold text-ink-soft transition hover:text-ink"
                >
                  {link.label}
                </Link>
              ) : (
                <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClass}>
                  {({ isActive }) => (
                    <>
                      {link.label}
                      {isActive ? (
                        <span className="absolute -bottom-[21px] left-0 right-0 h-0.5 rounded-full bg-rwanda-blue" />
                      ) : null}
                    </>
                  )}
                </NavLink>
              )
            )}
            {user ? (
              <NavLink to={home} className={navLinkClass}>
                {({ isActive }) => (
                  <>
                    {t('nav.dashboard')}
                    {isActive ? (
                      <span className="absolute -bottom-[21px] left-0 right-0 h-0.5 rounded-full bg-rwanda-blue" />
                    ) : null}
                  </>
                )}
              </NavLink>
            ) : null}
          </nav>

          <div className="flex items-center gap-2.5">
            <LanguageSwitcher className="hidden sm:inline-flex" />

            {user ? (
              <div className="relative hidden lg:block" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-xl border border-ink/10 bg-white py-1.5 pl-1.5 pr-2.5 transition hover:border-ink/20 hover:bg-ink/[0.02]"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <Avatar
                    firstName={user.firstName}
                    lastName={user.lastName}
                    size="sm"
                    tone={isOfficial ? 'blue' : 'green'}
                  />
                  <span className="max-w-[110px] truncate text-sm font-semibold text-ink">
                    {user.firstName}
                  </span>
                  <ChevronDown
                    className={cn('h-4 w-4 text-ink-muted transition', menuOpen && 'rotate-180')}
                  />
                </button>

                {menuOpen ? (
                  <div
                    className="absolute right-0 mt-2 w-64 animate-fade-up overflow-hidden rounded-2xl border border-ink/10 bg-white p-1.5 shadow-soft"
                    role="menu"
                  >
                    <div className="mb-1 border-b border-ink/5 px-3 py-2.5">
                      <p className="truncate text-sm font-bold text-ink">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="truncate text-xs text-ink-muted">{user.email}</p>
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-rwanda-green-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rwanda-green-dark">
                        <ShieldCheck className="h-3 w-3" />
                        {user.role === 'super_admin'
                          ? t('nav.super_admin')
                          : user.role === 'district_head' || user.role === 'sector_head'
                            ? t('nav.admin')
                            : t('common.account')}
                      </span>
                    </div>
                    <Link
                      to={home}
                      role="menuitem"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft transition hover:bg-ink/[0.04] hover:text-ink"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      {t('nav.dashboard')}
                    </Link>
                    <Link
                      to="/profile"
                      role="menuitem"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft transition hover:bg-ink/[0.04] hover:text-ink"
                    >
                      <UserRound className="h-4 w-4" />
                      {t('dashboard.profile')}
                    </Link>
                    {user.role === 'super_admin' ? (
                      <Link
                        to="/super-admin"
                        role="menuitem"
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft transition hover:bg-ink/[0.04] hover:text-ink"
                      >
                        <Globe2 className="h-4 w-4" />
                        {t('nav.super_admin')}
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleLogout}
                      role="menuitem"
                      className="mt-1 flex w-full items-center gap-2.5 rounded-lg border-t border-ink/5 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('nav.logout')}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="hidden items-center gap-2 lg:flex">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    {t('nav.login')}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" variant="green">
                    {t('nav.register')}
                  </Button>
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink/10 text-ink transition hover:bg-ink/5 lg:hidden"
              aria-label={mobileOpen ? t('nav.close_menu') : t('nav.menu')}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <div className="absolute inset-x-0 top-full max-h-[calc(100vh-72px)] overflow-y-auto border-b border-ink/10 bg-white shadow-soft lg:hidden">
          <div className="container-page space-y-1 py-4">
            {publicLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-ink/[0.04] hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <div className="my-3 border-t border-ink/10" />
                <div className="flex items-center gap-3 px-3 py-2">
                  <Avatar
                    firstName={user.firstName}
                    lastName={user.lastName}
                    size="md"
                    tone={isOfficial ? 'blue' : 'green'}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate text-xs text-ink-muted">{user.email}</p>
                  </div>
                </div>
                <Link
                  to={home}
                  className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-ink/[0.04] hover:text-ink"
                >
                  {t('nav.dashboard')}
                </Link>
                <Link
                  to="/profile"
                  className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-ink/[0.04] hover:text-ink"
                >
                  {t('dashboard.profile')}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link to="/login">
                  <Button variant="secondary" fullWidth>
                    {t('nav.login')}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="green" fullWidth>
                    {t('nav.register')}
                  </Button>
                </Link>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-ink/10 pt-3">
              <span className="text-xs font-semibold text-ink-muted">{t('common.language')}</span>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
