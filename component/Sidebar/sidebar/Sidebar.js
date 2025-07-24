"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Styles from './Sidebar.module.css';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import MenuIcon from '@mui/icons-material/Menu';
import { IconButton } from '@mui/material';
import { getLocalStorage } from '../../../helperFunction/localStorage.js';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const user = getLocalStorage('user');
    const selectedOrgId = getLocalStorage('selectedOrgId');
    const org = user?.organizationId?.find(org => org._id === selectedOrgId);
    setSelectedOrg(org);
  }, []);

  const menuItems = [];
  if (selectedOrg) {
    if (selectedOrg.workpermitDashboard) {
      menuItems.push({
        title: 'Work Permit Dashboard',
        icon: <DashboardIcon />,
        path: '/dashboard',
      });
    }
    if (selectedOrg.firDashboard) {
      menuItems.push({
        title: 'FIR Dashboard',
        icon: <LocalFireDepartmentIcon />,
        path: '/fir-dashboard',
      });
    }
    if (selectedOrg.unsafeDashboard) {
      menuItems.push({
        title: 'Unsafe Dashboard',
        icon: <HealthAndSafetyIcon />,
        path: '/safety-dashboard',
      });
    }
  }

  if (selectedOrg === null) return null;

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className={`${Styles.sidebar} ${
        isCollapsed ? Styles.collapsed : ''
      }`}
    >
     <div className={Styles.toggleButton}>
  {/* ✅ Safety Dashboard label on the left */}
  <span style={{ color: 'white', marginRight: '8px', fontWeight: 600 }}>
   
  </span>

  {/* Menu Icon on the right */}
  <IconButton onClick={toggleSidebar}>
    <MenuIcon sx={{ color: 'white' }} />
  </IconButton>
</div>

      <div className={Styles.menuItems}>
        {menuItems.map((item, index) => (
          <div
            key={index}
            className={`${Styles.menuItem} ${pathname === item.path ? Styles.active : ''}`}
            onClick={() => router.push(item.path)}
          >
            <div className={Styles.icon}>{item.icon}</div>
            <span className={Styles.title}>{item.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
