"use client";
import React, { useEffect, useState } from "react";
import Styles from "./navbar.module.css";
import Button from '@mui/material/Button';
import ClockCounter from "./clockCounter";
import Cookies from "js-cookie";
import { useRouter, usePathname } from "next/navigation";
import { getLocalStorage, removeItemLocalStorage, setLocalStorage } from "../../../helperFunction/localStorage";
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

const Nav = ({ formName, multiOrgDropdown=true }) => {
  const router = useRouter();
  const pathname = usePathname();

  // Profile menu state management
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    setUserData(getLocalStorage('user') || {});
    setSelectedOrgId(getLocalStorage('selectedOrgId'));
    setUser(getLocalStorage('user'));
  }, []);

  // Always show all orgs if more than one
  const allOrgs = userData?.organizationId || [];

  // Handle plant/org switch
  const handleOrgChange = (event) => {
    setSelectedOrgId(event.target.value);
    setLocalStorage('selectedOrgId', event.target.value);
    window.location.reload(); // reload to update context everywhere
  };
  
  // Define routes that should not show logout option
  const routesWithoutLogout = ['/home', `/status\/\\d+`];
  const shouldShowLogout = !routesWithoutLogout.some((pattern) => new RegExp(pattern).test(pathname));

  // Handle profile menu click
  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle menu close
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Handle logout action
  const logout = async () => {
    handleClose();
    Cookies.remove("loggedIn");
    await removeItemLocalStorage(["user", "token"])
    router.replace("/");
  };

  // Get first letter of user's name for avatar
  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  // Prevent hydration mismatch: render nothing until userData is loaded
  if (!userData) return null;

  return (
    <nav className={Styles.navBody}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* Plant Switcher Dropdown */}
        {allOrgs && allOrgs.length > 1 && multiOrgDropdown && (
          <FormControl size="small" sx={{ minWidth: 140, marginRight: 2, marginLeft: '20px' }}>
            <InputLabel id="plant-switcher-label">Plant</InputLabel>
            <Select
              labelId="plant-switcher-label"
              id="plant-switcher"
              value={selectedOrgId || allOrgs[0]._id}
              label="Plant"
              onChange={handleOrgChange}
            >
              {allOrgs.map(org => (
                <MenuItem key={org._id} value={org._id}>{org.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <div className={Styles.formName} onClick={() => shouldShowLogout && router.push('/dashboard')}>
          {formName ? formName : process.env.NEXT_PUBLIC_COMPANY}
        </div>
      </div>
      <div className={`${Styles.clock} d-flex justify-content-between `} style={{ marginRight: '24px', marginBottom: '5px' }}>
        <ClockCounter />
        {/* Profile Icon and Menu */}
        {shouldShowLogout && (
          <div style={{ marginLeft: '-20px' }}>
            {/* Enhanced Avatar with gradient background */}
            <IconButton
              onClick={handleProfileClick}
              size="small"
              sx={{
                padding: 0,    
                '&:hover': { backgroundColor: 'transparent' },
                marginLeft: '10px' // Add spacing from clock
              }}
            >
              <Avatar
                sx={{
                  width: 35,
                  height: 35,
                  fontSize: '16px',
                  fontWeight: '500',
                  background: 'linear-gradient(135deg, #0073FF 0%, #00C6FB 100%)', // Professional gradient
                  color: '#FFFFFF',
                  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' // Subtle shadow
                }}
              >
                {getInitial(user?.name)}
              </Avatar>
            </IconButton>
                         
            {/* Profile Dropdown Menu */}
            <Menu
              id="profile-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              MenuListProps={{
                'aria-labelledby': 'profile-button',
              }}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  minWidth: '200px'
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              {/* User Profile Information */}
              <MenuItem onClick={handleClose} disabled sx={{ opacity: 1 }}>
                <div>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      color: '#0073FF',
                      fontSize: '14px'
                    }}
                  >
                    {user?.name || 'User'}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#5F6368',
                      fontSize: '12px'
                    }}
                  >
                    {user?.email || 'No email available'}
                  </Typography>
                </div>
              </MenuItem>
              <Divider sx={{ my: 1 }} />
              {/* Logout Option */}
              <MenuItem
                onClick={logout}
                sx={{
                  '&:hover': {
                    backgroundColor: '#F8F9FA'
                  }
                }}
              >
                <Typography
                  sx={{
                    color: '#D93025',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  Logout
                </Typography>
              </MenuItem>
            </Menu>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Nav;
