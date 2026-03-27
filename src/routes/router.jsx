import MerchantOnboarding from '../pages/marketplace/MerchantOnboarding';
import MerchantVerification from '../pages/admin/MerchantVerification';

// ... other imports
// I need to be careful with the exact lines to replace.
// Let's re-do the view to see line numbers and replace specific sections.
import { createBrowserRouter, Navigate } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import { useAuth } from '../context/authContext';
import Dashboard from '../pages/user/Dashboard';
import DashboardHome from '../pages/user/DashboardHome';
import AntarJemput from '../pages/user/AntarJemput';
import JasaTitip from '../pages/user/JasaTitip';
import Marketplace from '../pages/user/Marketplace';
import OrderSaya from '../pages/user/OrderSaya';
import Profil from '../pages/user/Profil';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import MerchantChat from '../pages/marketplace/MerchantChat';
import UserChat from '../pages/user/UserChat';


import DriverDashboard from '../pages/driver/DriverDashboard';
import DriverOnboarding from '../pages/driver/DriverOnboarding';
import DriverLayout from '../layouts/DriverLayout';
import DriverChat from '../pages/driver/DriverChat';
import DriverOrders from '../pages/driver/DriverOrders';
import DriverBroadcasts from '../pages/driver/DriverBroadcasts';
import DriverJastip from '../pages/driver/DriverJastip';

import AdminLayout from '../layouts/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import UserManagement from '../pages/admin/UserManagement';
import DriverVerification from '../pages/admin/DriverVerification';
import ReportManagement from '../pages/admin/ReportManagement';

import MerchantLayout from '../layouts/MerchantLayout';
import MerchantDashboard from '../pages/marketplace/MerchantDashboard';
import ProductManagement from '../pages/marketplace/ProductManagement';
import MerchantOrders from '../pages/marketplace/MerchantOrders';
import MerchantProfile from '../pages/marketplace/MerchantProfile';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) return <div className="p-10">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

    return children;
};

const router = createBrowserRouter([
    {
        path: '/',
        element: <LandingPage />,
    },
    {
        path: '/login',
        element: <Login />,
    },
    {
        path: '/register',
        element: <Register />,
    },
    {
        path: '/user',
        element: <ProtectedRoute allowedRoles={['user']}><Dashboard /></ProtectedRoute>,
        children: [
            { index: true, element: <DashboardHome /> },
            { path: 'antar-jemput', element: <AntarJemput /> },
            { path: 'jasa-titip', element: <JasaTitip /> },
            { path: 'marketplace', element: <Marketplace /> },
            { path: 'order', element: <OrderSaya /> },
            { path: 'profil', element: <Profil /> },
            { path: 'chat', element: <UserChat /> },
            { path: 'chat/:id', element: <UserChat /> },
        ]
    },
    {
        path: '/driver/onboarding',
        element: <ProtectedRoute allowedRoles={['driver']}><DriverOnboarding /></ProtectedRoute>
    },
    {
        path: '/driver',
        element: <ProtectedRoute allowedRoles={['driver']}><DriverLayout /></ProtectedRoute>,
        children: [
            { index: true, element: <DriverDashboard /> },
            { path: 'dashboard', element: <DriverDashboard /> },
            { path: 'chat', element: <DriverChat /> },
            { path: 'chat/:id', element: <DriverChat /> },
            { path: 'orders', element: <DriverOrders /> },
            { path: 'jastip', element: <DriverJastip /> },
            { path: 'broadcasts', element: <DriverBroadcasts /> },
            { path: 'profile', element: <div className="p-8"><h1 className="text-2xl font-bold">Profil (Coming Soon)</h1></div> },
        ]
    },
    {
        path: '/admin',
        element: <ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>,
        children: [
            { index: true, element: <AdminDashboard /> },
            { path: 'users', element: <UserManagement /> },
            { path: 'drivers', element: <DriverVerification /> },
            { path: 'merchants', element: <MerchantVerification /> },
            { path: 'reports', element: <ReportManagement /> }
        ]
    },
    {
        path: '/merchant/onboarding',
        element: <ProtectedRoute allowedRoles={['marketplace']}><MerchantOnboarding /></ProtectedRoute>
    },
    {
        path: '/merchant',
        element: <ProtectedRoute allowedRoles={['marketplace']}><MerchantLayout /></ProtectedRoute>,
        children: [
            { index: true, element: <MerchantDashboard /> },
            { path: 'products', element: <ProductManagement /> },
            { path: 'orders', element: <MerchantOrders /> },
            { path: 'chat', element: <MerchantChat /> },
            { path: 'chat/:id', element: <MerchantChat /> },
            { path: 'profile', element: <MerchantProfile /> }
        ]
    }
]);

export default router;
