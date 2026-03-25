import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/user/Sidebar';
import DashboardNavbar from '../../components/user/DashboardNavbar';
import { LocationProvider } from '../../context/LocationContext';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <LocationProvider>
      <div className="min-h-screen bg-[#f3ede3] flex">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} />

        {/* Main Content */}
        <main className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
          <DashboardNavbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

          <Outlet />
        </main>
      </div>
    </LocationProvider>
  );
};

export default Dashboard;
