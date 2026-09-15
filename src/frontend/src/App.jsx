import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import HomePage from './pages/HomePage'
import VesselsPage from './pages/VesselsPage'
import PortsPage from './pages/PortsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import OperationsPage from './pages/OperationsPage'
import AlertsPage from './pages/AlertsPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
<<<<<<< HEAD

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="vessels" element={<VesselsPage />} />
          <Route path="ports" element={<PortsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="operations" element={<OperationsPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          {/* Legacy routes preserved */}
          <Route path="predictions" element={<AnalyticsPage />} />
          <Route path="optimizer" element={<OperationsPage />} />
          <Route path="schedule" element={<OperationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
=======
import DataImportPage from './pages/DataImportPage'
import { LanguageProvider } from './i18n/LanguageContext'

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="vessels" element={<VesselsPage />} />
            <Route path="ports" element={<PortsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="operations" element={<OperationsPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="import"   element={<DataImportPage />} />
            {/* Legacy routes preserved */}
            <Route path="predictions" element={<AnalyticsPage />} />
            <Route path="optimizer" element={<OperationsPage />} />
            <Route path="schedule" element={<OperationsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
>>>>>>> 3b90e15 (feat: complete PortMind production integration — AI 72h operational schedule, XGBoost+LightGBM ensemble, CSV ingestion, i18n & command center)
  )
}
