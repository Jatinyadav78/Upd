'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, Typography, Grid, Box } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import WorkflowIcon from '@mui/icons-material/AccountTree';
import MapIcon from '@mui/icons-material/Map';
import Loader from '../ui/loader/loader.js';
import Styles from './usermanagement.module.css';

const UserManagement = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreateDepartment = () => {
    setLoading(true);
    // Simulate loading time for navigation
    setTimeout(() => {
      router.push('/datacreate?type=department');
    }, 500);
  };

  const handleCreateWorkflow = () => {
    setLoading(true);
    // Simulate loading time for navigation
    setTimeout(() => {
      router.push('/datacreate?type=workflow');
    }, 500);
  };

  const handleMapDepartment = () => {
    setLoading(true);
    // Simulate loading time for navigation
    setTimeout(() => {
      router.push('/datacreate?type=map');
    }, 500);
  };

  return (
    <div className={Styles.container}>
      {loading && <Loader overlay={true} size={80} />}
      
      <Typography variant="h4" component="h1" gutterBottom className={Styles.title}>
        User Management
      </Typography>
      
      <Grid container spacing={3} className={Styles.buttonGrid}>
        <Grid item xs={12} md={4}>
          <Card className={Styles.card} onClick={handleCreateDepartment}>
            <CardContent className={Styles.cardContent}>
              <BusinessIcon className={Styles.icon} />
              <Typography variant="h6" component="h2" className={Styles.buttonTitle}>
                Department
              </Typography>
              <Typography variant="body2" color="textSecondary" className={Styles.description}>
                Create and manage departments within your organization
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card className={Styles.card} onClick={handleCreateWorkflow}>
            <CardContent className={Styles.cardContent}>
              <WorkflowIcon className={Styles.icon} />
              <Typography variant="h6" component="h2" className={Styles.buttonTitle}>
                 Workflow
              </Typography>
              <Typography variant="body2" color="textSecondary" className={Styles.description}>
                Define approval workflows and assign approvers
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card className={Styles.card} onClick={handleMapDepartment}>
            <CardContent className={Styles.cardContent}>
              <MapIcon className={Styles.icon} />
              <Typography variant="h6" component="h2" className={Styles.buttonTitle}>
                Map Department
              </Typography>
              <Typography variant="body2" color="textSecondary" className={Styles.description}>
                Map departments to workflows and manage relationships
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default UserManagement;
