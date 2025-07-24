

"use client";
import React, { useState, useEffect } from 'react';
import Nav from './navbar/navbar.js'
import Sidebar from '../Sidebar/sidebar/Sidebar.js';
import Styles from './layout.module.css'

const Layout = ({children, formName, multiOrgDropdown, hideSidebar = false}) => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsSidebarExpanded(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={Styles.layoutContainer}>
      {!hideSidebar && <Sidebar onToggle={(expanded) => setIsSidebarExpanded(expanded)} />}
      <div className={`${Styles.mainContent} ${isSidebarExpanded && !hideSidebar ? Styles.expanded : ''} ${hideSidebar ? Styles.fullWidth : ''}`}>
        <header className={Styles.navbar}>
          <Nav formName={formName} multiOrgDropdown={multiOrgDropdown} />
        </header>
        <main className={Styles.main}>{children}</main>
        <footer className={Styles.footer}>
        </footer>
      </div>
    </div>    
  )
}

export default Layout;

//