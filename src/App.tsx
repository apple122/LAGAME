import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import HomePage from './pages/Home/HomePage'
import GameDetailPage from './pages/Game/GameDetailPage'
import AZFilterPage from './pages/AZFilter/AZFilterPage'
import TopGamesPage from './pages/TopGames/TopGamesPage'
import InterstitialPage from './pages/Interstitial/InterstitialPage'
// AdminGateway bypassed
import AdminLayout from './pages/Admin/AdminLayout'
import AdminDashboard from './pages/Admin/Dashboard/AdminDashboard'
import AddGame from './pages/Admin/Games/AddGame'
import ManageGames from './pages/Admin/Games/ManageGames'
import EditGame from './pages/Admin/Games/EditGame'
import ManageCategories from './pages/Admin/Categories/ManageCategories'
import AdSettingsPage from './pages/Admin/Ads/AdSettingsPage'
import ManageApiKeys from './pages/Admin/ApiKeys/ManageApiKeys'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { AdSettingsProvider } from './context/AdSettingsContext'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'

function App() {
  return (
    <AdminAuthProvider>
      <AdSettingsProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="game/:slug" element={<GameDetailPage />} />
              <Route path="az-filter" element={<AZFilterPage />} />
              <Route path="top-games" element={<TopGamesPage />} />
            </Route>

            {/* Interstitial download page (no layout) */}
            <Route path="/download-redirect" element={<InterstitialPage />} />

            {/* Admin gateway (Bypassed) */}
            <Route path="/ap-admin" element={<Navigate to="/ap-admin/dashboard" replace />} />

            {/* Protected admin routes */}
            <Route
              path="/ap-admin/*"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout />
                </ProtectedAdminRoute>
              }
            >
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="games" element={<ManageGames />} />
              <Route path="games/add" element={<AddGame />} />
              <Route path="games/edit/:id" element={<EditGame />} />
              <Route path="categories" element={<ManageCategories />} />
              <Route path="ads" element={<AdSettingsPage />} />
              <Route path="api-keys" element={<ManageApiKeys />} />
              <Route path="" element={<Navigate to="dashboard" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AdSettingsProvider>
    </AdminAuthProvider>
  )
}

export default App
