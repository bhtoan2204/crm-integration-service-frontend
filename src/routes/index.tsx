import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { CallsPage } from '@/pages/CallsPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { EmployeeDetailPage } from '@/pages/EmployeeDetailPage'
import { EmployeesPage } from '@/pages/EmployeesPage'
import { IntegrationsPage } from '@/pages/IntegrationsPage'
import { LeadDetailPage } from '@/pages/LeadDetailPage'
import { LeadsPage } from '@/pages/LeadsPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { OrderDetailPage } from '@/pages/OrderDetailPage'
import { OrdersPage } from '@/pages/OrdersPage'
import { PipelinePage } from '@/pages/PipelinePage'
import { ProfilePage } from '@/pages/ProfilePage'
import { FlowPage } from '@/pages/FlowPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { RequireAuth } from '@/routes/RequireAuth'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'quy-trinh', element: <FlowPage /> },
          { path: 'leads', element: <LeadsPage /> },
          { path: 'leads/:id', element: <LeadDetailPage /> },
          { path: 'pipeline', element: <PipelinePage /> },
          { path: 'calls', element: <CallsPage /> },
          { path: 'orders', element: <OrdersPage /> },
          { path: 'orders/:id', element: <OrderDetailPage /> },
          { path: 'reports', element: <ReportsPage /> },
          { path: 'employees', element: <EmployeesPage /> },
          { path: 'employees/:id', element: <EmployeeDetailPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'integrations', element: <IntegrationsPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/login" replace /> },
])
