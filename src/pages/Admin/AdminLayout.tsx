import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { LayoutDashboard, Gamepad2, Tags, Megaphone, LogOut, Menu, X, Key, MessageSquare } from 'lucide-react'
import { useAdminAuth } from '../../context/AdminAuthContext'

const Shell = styled.div`display: flex; min-height: 100vh; background: #080810;`

const Sidebar = styled.aside<{ $open: boolean }>`
  width: 240px; flex-shrink: 0;
  background: rgba(12,12,22,0.95); backdrop-filter: blur(16px);
  border-right: 1px solid rgba(124,58,237,0.15);
  display: flex; flex-direction: column;
  @media (max-width: 768px) {
    position: fixed; left: ${p => p.$open ? '0' : '-240px'};
    top: 0; bottom: 0; z-index: 200; transition: left 0.25s ease;
  }
`

const SidebarTop = styled.div`
  padding: 24px 20px 20px;
  border-bottom: 1px solid rgba(124,58,237,0.1);
`

const Logo = styled.div`
  display: flex; align-items: center; gap: 10px;
  font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 800;
  background: linear-gradient(135deg, #7c3aed, #06b6d4);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  margin-bottom: 4px;
`

const AdminBadge = styled.div`
  font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
  color: rgba(148,163,184,0.5); padding-left: 2px;
`

const Nav = styled.nav`flex: 1; padding: 16px 12px;`

const NavItem = styled(NavLink)`
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 10px; margin-bottom: 4px;
  font-size: 14px; font-weight: 500; color: rgba(148,163,184,0.8);
  transition: all 0.15s;
  &:hover { background: rgba(124,58,237,0.12); color: #fff; }
  &.active { background: rgba(124,58,237,0.2); color: #fff; border: 1px solid rgba(124,58,237,0.25); }
`

const LogoutBtn = styled.button`
  display: flex; align-items: center; gap: 10px;
  padding: 12px 20px; width: 100%;
  background: transparent; border: none; border-top: 1px solid rgba(124,58,237,0.1);
  color: rgba(148,163,184,0.6); font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.15s;
  &:hover { color: #ef4444; background: rgba(239,68,68,0.08); }
`

const Main = styled.main`flex: 1; overflow-x: hidden;`

const TopBar = styled.div`
  height: 60px; background: rgba(12,12,22,0.8); backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(124,58,237,0.1);
  display: flex; align-items: center; padding: 0 24px; gap: 16px;
  position: sticky; top: 0; z-index: 100;
`

const MobileToggle = styled.button`
  display: none;
  @media (max-width: 768px) { display: flex; align-items: center; }
  background: none; border: none; color: #e2e8f0; cursor: pointer;
`

const Backdrop = styled.div<{ $open: boolean }>`
  display: none;
  @media (max-width: 768px) { display: ${p => p.$open ? 'block' : 'none'}; }
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 199;
`

const Content = styled.div`padding: 28px 24px;`

const navItems = [
  { to: '/ap-admin/dashboard', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
  { to: '/ap-admin/support', icon: <MessageSquare size={16} />, label: 'Support Chat' },
  { to: '/ap-admin/games', icon: <Gamepad2 size={16} />, label: 'Manage Games' },
  { to: '/ap-admin/categories', icon: <Tags size={16} />, label: 'Categories' },
  { to: '/ap-admin/comments', icon: <MessageSquare size={16} />, label: 'Comments' },
  { to: '/ap-admin/api-keys', icon: <Key size={16} />, label: 'API Keys' },
  { to: '/ap-admin/top-ranking', icon: <Megaphone size={16} />, label: 'AI Top Ranking' },
  { to: '/ap-admin/ads', icon: <Megaphone size={16} />, label: 'Ad Settings' },
]

export default function AdminLayout() {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/ap-admin') }

  return (
    <Shell>
      <Backdrop $open={sidebarOpen} onClick={() => setSidebarOpen(false)} />
      <Sidebar $open={sidebarOpen}>
        <SidebarTop>
          <Logo><Gamepad2 size={22} /> LAPACK</Logo>
          <AdminBadge>🔐 Admin Panel</AdminBadge>
        </SidebarTop>

        <Nav>
          {navItems.map(item => (
            <NavItem key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}>
              {item.icon}
              {item.label}
            </NavItem>
          ))}
        </Nav>

        <LogoutBtn onClick={handleLogout}>
          <LogOut size={14} /> Logout
        </LogoutBtn>
      </Sidebar>

      <Main>
        <TopBar>
          <MobileToggle onClick={() => setSidebarOpen(v => !v)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </MobileToggle>
          <span style={{ fontSize: 14, color: 'rgba(148,163,184,0.6)', fontWeight: 500 }}>Admin Dashboard</span>
        </TopBar>
        <Content>
          <Outlet />
        </Content>
      </Main>
    </Shell>
  )
}
