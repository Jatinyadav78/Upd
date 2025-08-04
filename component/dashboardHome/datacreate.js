'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getLocalStorage } from '../../helperFunction/localStorage';

import { api } from '../../utils';

// API base URLs constants
const GET_API_BASE_URL = `${api}v1`;
const API_BASE_URL = `${api}v1`;

import {
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import Loader from '../ui/loader/loader.js';
import Styles from './datacreate.module.css';

const DataCreate = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type');

  // Loading states
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // State for different sections
  const [departments, setDepartments] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [mappings, setMappings] = useState([]);
  
  // Dialog states
  const [departmentDialog, setDepartmentDialog] = useState(false);
  const [workflowDialog, setWorkflowDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [editingWorkflow, setEditingWorkflow] = useState(null);

  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Form states
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    code: '',
    organizationId: '',
  });

  const [workflowForm, setWorkflowForm] = useState({
    name: '',
    description: '',
    organizationId: '',
    departmentId: '',
    approvers: [],
    escalationAlert: false,
    isActive: true
  });

  // Mock data for organizations (for dropdown)
  const mockOrganizations = [
    { id: '66007bc3c0171669e42e4546', name: 'Organization 1' },
    { id: 'ORG001', name: 'Organization 2' },
    { id: 'ORG002', name: 'Organization 3' }
  ];

  // Mock data for departments (for dropdown)
  const mockDepartmentOptions = [
    { id: 'HR', name: 'HR' },
    { id: 'IT', name: 'IT' },
    { id: 'Finance', name: 'Finance' },
    { id: 'Operations', name: 'Operations' }
  ];

  // Mock data for users (for approvers dropdown)
  const mockUsers = [
    { id: 'Naman Agarwal', name: 'Naman Agarwal', email: 'naman.agarwal@jbmgroup.com' },
    { id: 'John Doe', name: 'John Doe', email: 'john.doe@jbmgroup.com' },
    { id: 'Jane Smith', name: 'Jane Smith', email: 'jane.smith@jbmgroup.com' },
    { id: 'Mike Johnson', name: 'Mike Johnson', email: 'mike.johnson@jbmgroup.com' }
  ];

  // Function to get organization name by ID
  const getOrganizationName = (orgId) => {
    const org = mockOrganizations.find(org => org.id === orgId);
    return org ? org.name : orgId;
  };

  // API Functions
  const fetchDepartments = async (orgId = null) => {
    try {
      setDataLoading(true);
      // Get the organization ID from the parameter, form, or default to the first mock organization
      const organizationId = orgId || departmentForm.organizationId || mockOrganizations[0].id;
      const response = await fetch(`${GET_API_BASE_URL}/departments/?organizationId=${organizationId}`, {
        headers: {
          'Authorization': getLocalStorage('token')
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setNotification({
        open: true,
        message: 'Failed to fetch departments',
        severity: 'error'
      });
    } finally {
      setDataLoading(false);
    }
  };

  const createDepartment = async (departmentData) => {
    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/departments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getLocalStorage('token')
        },
        body: JSON.stringify(departmentData),
      });
      if (!response.ok) {
        throw new Error('Failed to create department');
      }
      const data = await response.json();
      setDepartments([...departments, data]);
      setNotification({
        open: true,
        message: 'Department created successfully',
        severity: 'success'
      });
      return data;
    } catch (error) {
      console.error('Error creating department:', error);
      setNotification({
        open: true,
        message: 'Failed to create department',
        severity: 'error'
      });
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const updateDepartment = async (id, departmentData) => {
    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getLocalStorage('token')
        },
        body: JSON.stringify(departmentData),
      });
      if (!response.ok) {
        throw new Error('Failed to update department');
      }
      const data = await response.json();
      setDepartments(departments.map(dept => dept._id === id ? data : dept));
      setNotification({
        open: true,
        message: 'Department updated successfully',
        severity: 'success'
      });
      return data;
    } catch (error) {
      console.error('Error updating department:', error);
      setNotification({
        open: true,
        message: 'Failed to update department',
        severity: 'error'
      });
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const deleteDepartment = async (id) => {
    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': getLocalStorage('token')
        }
      });
      if (!response.ok) {
        throw new Error('Failed to delete department');
      }
      setDepartments(departments.filter(dept => dept._id !== id));
      setNotification({
        open: true,
        message: 'Department deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting department:', error);
      setNotification({
        open: true,
        message: 'Failed to delete department',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Function to get a single department by ID
  const getDepartmentById = async (id) => {
    try {
      setDataLoading(true);
      const response = await fetch(`${GET_API_BASE_URL}/departments/${id}`, {
        headers: {
          'Authorization': getLocalStorage('token')
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch department');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching department:', error);
      setNotification({
        open: true,
        message: 'Failed to fetch department',
        severity: 'error'
      });
      return null;
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (type === 'department') {
      fetchDepartments();
    } else if (type === 'workflow') {
      // Simulate data loading for workflows
      setDataLoading(true);
      setTimeout(() => {
        setWorkflows([
          {
            id: '68625ffb3657da25ac252094',
            name: 'approver',
            description: '21',
            organizationId: 'Thirdeye-Ai',
            departmentId: 'HR',
            approvers: [
              {
                userId: 'Naman Agarwal',
                email: 'naman.agarwal@jbmgroup.com',
                isMandatory: true,
                status: 'pending'
              }
            ],
            escalationAlert: [],
            isActive: true,
            createdAt: '2025/06/30 15:29',
            updatedAt: '2025/06/30 15:29'
          }
        ]);
        setDataLoading(false);
      }, 1000);
    } else if (type === 'map') {
      // Simulate data loading for mappings
      setDataLoading(true);
      setTimeout(() => {
        setMappings([
          {
            id: 1,
            department: 'HR',
            workflow: 'HR Approval Workflow',
            status: 'Active'
          },
          {
            id: 2,
            department: 'IT',
            workflow: 'IT Approval Workflow',
            status: 'Active'
          }
        ]);
        setDataLoading(false);
      }, 1000);
    }
  }, [type]);

  const handleBack = () => {
    setLoading(true);
    setTimeout(() => {
      router.push('/usermanagement');
    }, 300);
  };

  const handleDepartmentSubmit = async () => {
    try {
      const departmentData = {
        name: departmentForm.name,
        code: departmentForm.code,
        organizationId: departmentForm.organizationId
      };

      if (editingDepartment) {
        await updateDepartment(editingDepartment._id, departmentData);
      } else {
        await createDepartment(departmentData);
      }

      setDepartmentForm({ name: '', code: '', organizationId: '' });
      setEditingDepartment(null);
      setDepartmentDialog(false);
    } catch (error) {
      console.error('Error submitting department:', error);
    }
  };

  const handleWorkflowSubmit = () => {
    setSubmitting(true);
    
    // Simulate API call for workflow
    setTimeout(() => {
      const newWorkflow = {
        id: editingWorkflow ? editingWorkflow.id : `wf_${Date.now()}`,
        ...workflowForm,
        createdAt: editingWorkflow ? editingWorkflow.createdAt : new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString()
      };
      
      if (editingWorkflow) {
        setWorkflows(workflows.map(wf => 
          wf.id === editingWorkflow.id ? newWorkflow : wf
        ));
      } else {
        setWorkflows([...workflows, newWorkflow]);
      }
      
      setWorkflowForm({
        name: '',
        description: '',
        organizationId: '',
        departmentId: '',
        approvers: [],
        escalationAlert: [],
        isActive: true
      });
      setEditingWorkflow(null);
      setWorkflowDialog(false);
      setSubmitting(false);
    }, 1000);
  };

  const handleEditDepartment = (department) => {
    setEditingDepartment(department);
    setDepartmentForm({
      name: department.name,
      code: department.code,
      organizationId: department.organizationId
    });
    setDepartmentDialog(true);
  };

  const handleEditWorkflow = (workflow) => {
    setEditingWorkflow(workflow);
    setWorkflowForm({
      name: workflow.name,
      description: workflow.description,
      organizationId: workflow.organizationId,
      departmentId: workflow.departmentId,
      approvers: workflow.approvers,
      escalationAlert: workflow.escalationAlert,
      isActive: workflow.isActive
    });
    setWorkflowDialog(true);
  };

  const handleDeleteDepartment = (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      deleteDepartment(id);
    }
  };

  const handleDeleteWorkflow = (id) => {
    setSubmitting(true);
    setTimeout(() => {
      setWorkflows(workflows.filter(wf => wf.id !== id));
      setSubmitting(false);
    }, 500);
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const renderDepartmentSection = () => (
    <div>
      <Box display="flex" alignItems="center" mb={2}>
        <Typography variant="body2" color="textSecondary">
          Dashboard / Department
        </Typography>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Typography variant="h4" sx={{ mr: 2 }}>List</Typography>
          <Box
            sx={{
              backgroundColor: '#1b5cb8',
              color: 'white',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {departments.length}
          </Box>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDepartmentDialog(true)}
            className={Styles.addButton}
            disabled={submitting}
          >
            Create new
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <input type="checkbox" />
              </TableCell>
              <TableCell>Name ↑</TableCell>
              <TableCell>Id</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Organization Id</TableCell>
              <TableCell>Updated At</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.map((dept) => (
              <TableRow key={dept._id}>
                <TableCell padding="checkbox">
                  <input type="checkbox" />
                </TableCell>
                <TableCell>{dept.name}</TableCell>
                <TableCell>{dept._id}</TableCell>
                <TableCell>{dept.code}</TableCell>
                <TableCell>
                  <Typography color="primary" sx={{ cursor: 'pointer' }}>
                    {getOrganizationName(dept.organizationId)}
                  </Typography>
                </TableCell>
                <TableCell>{new Date(dept.updatedAt).toLocaleString()}</TableCell>
                <TableCell>{new Date(dept.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  <IconButton 
                    onClick={() => handleEditDepartment(dept)}
                    disabled={submitting}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleDeleteDepartment(dept._id)}
                    disabled={submitting}
                  >
                    {submitting ? <Loader size={20} /> : <DeleteIcon />}
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={departmentDialog} onClose={() => setDepartmentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDepartment ? 'Edit Department' : 'Create new'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={departmentForm.name}
                onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Code"
                value={departmentForm.code}
                onChange={(e) => setDepartmentForm({ ...departmentForm, code: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Organization Id *</InputLabel>
                <Select
                  value={departmentForm.organizationId}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, organizationId: e.target.value })}
                  label="Organization Id *"
                  required
                >
                  {mockOrganizations.map((org) => (
                    <MenuItem key={org.id} value={org.id}>
                      {org.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDepartmentDialog(false);
              setDepartmentForm({ name: '', code: '', organizationId: '' });
              setEditingDepartment(null);
            }}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDepartmentSubmit} 
            variant="contained"
            disabled={submitting || !departmentForm.name || !departmentForm.code || !departmentForm.organizationId}
          >
            {submitting ? (
              <Box display="flex" alignItems="center">
                <Loader size={20} />
                <Box ml={1}>Saving...</Box>
              </Box>
            ) : (
              editingDepartment ? 'Update' : 'Save'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );

  const renderWorkflowSection = () => (
    <div>
      <Box display="flex" alignItems="center" mb={2}>
        <Typography variant="body2" color="textSecondary">
          Dashboard / Workflow
        </Typography>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Typography variant="h4" sx={{ mr: 2 }}>List</Typography>
          <Box
            sx={{
              backgroundColor: '#1b5cb8',
              color: 'white',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {workflows.length}
          </Box>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setWorkflowDialog(true)}
            className={Styles.addButton}
            disabled={submitting}
          >
            Create new
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <input type="checkbox" />
              </TableCell>
              <TableCell>Name ↑</TableCell>
              <TableCell>Id</TableCell>
              <TableCell>Organization Id</TableCell>
              <TableCell>Department Id</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Approvers</TableCell>
              <TableCell>Escalation Alert</TableCell>
              <TableCell>Is Active</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workflows.map((wf) => (
              <TableRow key={wf.id}>
                <TableCell padding="checkbox">
                  <input type="checkbox" />
                </TableCell>
                <TableCell>{wf.name}</TableCell>
                <TableCell>{wf.id}</TableCell>
                <TableCell>
                  <Typography color="primary" sx={{ cursor: 'pointer' }}>
                    {wf.organizationId}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography color="primary" sx={{ cursor: 'pointer' }}>
                    {wf.departmentId}
                  </Typography>
                </TableCell>
                <TableCell>{wf.description}</TableCell>
                <TableCell>Length: {wf.approvers.length}</TableCell>
                <TableCell>Length: {wf.escalationAlert.length}</TableCell>
                <TableCell>
                  <Button variant="contained" size="small" color="success">
                    Yes
                  </Button>
                </TableCell>
                <TableCell>
                  <IconButton 
                    onClick={() => handleEditWorkflow(wf)}
                    disabled={submitting}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleDeleteWorkflow(wf.id)}
                    disabled={submitting}
                  >
                    {submitting ? <Loader size={20} /> : <DeleteIcon />}
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={workflowDialog} onClose={() => setWorkflowDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingWorkflow ? 'Edit Workflow' : 'Create new'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>General Details</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={workflowForm.name}
                onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Organization Id</InputLabel>
                <Select
                  value={workflowForm.organizationId}
                  onChange={(e) => setWorkflowForm({ ...workflowForm, organizationId: e.target.value })}
                  label="Organization Id"
                >
                  {mockOrganizations.map((org) => (
                    <MenuItem key={org.id} value={org.id}>
                      {org.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Department Id</InputLabel>
                <Select
                  value={workflowForm.departmentId}
                  onChange={(e) => setWorkflowForm({ ...workflowForm, departmentId: e.target.value })}
                  label="Department Id"
                >
                  {mockDepartmentOptions.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={workflowForm.description}
                onChange={(e) => setWorkflowForm({ ...workflowForm, description: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Approvers</Typography>
            </Grid>
            {workflowForm.approvers.map((approver, index) => (
              <Grid item xs={12} key={index}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle1">[{index + 1}]</Typography>
                    <IconButton 
                      color="error" 
                      onClick={() => {
                        const newApprovers = workflowForm.approvers.filter((_, i) => i !== index);
                        setWorkflowForm({ ...workflowForm, approvers: newApprovers });
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Approvers User Id</InputLabel>
                        <Select
                          value={approver.userId}
                          onChange={(e) => {
                            const newApprovers = [...workflowForm.approvers];
                            newApprovers[index].userId = e.target.value;
                            newApprovers[index].email = mockUsers.find(u => u.id === e.target.value)?.email || '';
                            setWorkflowForm({ ...workflowForm, approvers: newApprovers });
                          }}
                          label="Approvers User Id"
                        >
                          {mockUsers.map((user) => (
                            <MenuItem key={user.id} value={user.id}>
                              {user.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Approvers Email"
                        value={approver.email}
                        onChange={(e) => {
                          const newApprovers = [...workflowForm.approvers];
                          newApprovers[index].email = e.target.value;
                          setWorkflowForm({ ...workflowForm, approvers: newApprovers });
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={approver.isMandatory}
                            onChange={(e) => {
                              const newApprovers = [...workflowForm.approvers];
                              newApprovers[index].isMandatory = e.target.checked;
                              setWorkflowForm({ ...workflowForm, approvers: newApprovers });
                            }}
                          />
                        }
                        label="Approvers Is Mandatory"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Approvers Status"
                        value={approver.status}
                        onChange={(e) => {
                          const newApprovers = [...workflowForm.approvers];
                          newApprovers[index].status = e.target.value;
                          setWorkflowForm({ ...workflowForm, approvers: newApprovers });
                        }}
                      />
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setWorkflowForm({
                    ...workflowForm,
                    approvers: [...workflowForm.approvers, {
                      userId: '',
                      email: '',
                      isMandatory: false,
                      status: 'pending'
                    }]
                  });
                }}
              >
                + Add New Item
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Escalation Alert</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setWorkflowForm({
                    ...workflowForm,
                    escalationAlert: [...workflowForm.escalationAlert, {}]
                  });
                }}
              >
                + Add New Item
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Status</Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={workflowForm.isActive}
                    onChange={(e) => setWorkflowForm({ ...workflowForm, isActive: e.target.checked })}
                  />
                }
                label="Is Active"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Updated At"
                value={workflowForm.updatedAt || '2025/06/30 15:29'}
                onChange={(e) => setWorkflowForm({ ...workflowForm, updatedAt: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Created At"
                value={workflowForm.createdAt || '2025/06/30 15:29'}
                onChange={(e) => setWorkflowForm({ ...workflowForm, createdAt: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setWorkflowDialog(false);
              setWorkflowForm({
                name: '',
                description: '',
                organizationId: '',
                departmentId: '',
                approvers: [],
                escalationAlert: [],
                isActive: true
              });
              setEditingWorkflow(null);
            }}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleWorkflowSubmit} 
            variant="contained"
            disabled={submitting}
          >
            {submitting ? (
              <Box display="flex" alignItems="center">
                <Loader size={20} />
                <Box ml={1}>Saving...</Box>
              </Box>
            ) : (
              editingWorkflow ? 'Update' : 'Save'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );

  const renderMapSection = () => (
    <div>
      <Box display="flex" alignItems="center" mb={2}>
        <Typography variant="body2" color="textSecondary">
          Dashboard / Department-Workflow Mapping
        </Typography>
      </Box>

      <Typography variant="h4" mb={3}>Map Department</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Departments</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Code</TableCell>
                      <TableCell>Organization Id</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {departments.map((dept) => (
                      <TableRow key={dept._id}>
                        <TableCell>{dept.name}</TableCell>
                        <TableCell>{dept.code}</TableCell>
                        <TableCell>
                          <Typography color="primary" sx={{ cursor: 'pointer' }}>
                            {dept.organizationId}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Workflows</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Department Id</TableCell>
                      <TableCell>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {workflows.map((wf) => (
                      <TableRow key={wf.id}>
                        <TableCell>{wf.name}</TableCell>
                        <TableCell>
                          <Typography color="primary" sx={{ cursor: 'pointer' }}>
                            {wf.departmentId}
                          </Typography>
                        </TableCell>
                        <TableCell>{wf.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Department-Workflow Mappings</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Department</TableCell>
                      <TableCell>Workflow</TableCell>
                      <TableCell>Organization Id</TableCell>
                      <TableCell>Approvers</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mappings.map((mapping) => (
                      <TableRow key={mapping.id}>
                        <TableCell>{mapping.department}</TableCell>
                        <TableCell>{mapping.workflow}</TableCell>
                        <TableCell>
                          <Typography color="primary" sx={{ cursor: 'pointer' }}>
                            Thirdeye-Ai
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {workflows.find(wf => wf.name === mapping.workflow)?.approvers.length || 0} Approvers
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={mapping.status} 
                            color={mapping.status === 'Active' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton>
                            <EditIcon />
                          </IconButton>
                          <IconButton>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );

  const getTitle = () => {
    switch (type) {
      case 'department':
        return 'Department Management';
      case 'workflow':
        return 'Workflow Management';
      case 'map':
        return 'Department-Workflow Mapping';
      default:
        return 'Data Management';
    }
  };

  return (
    <div className={Styles.container}>
      {(loading || dataLoading) && <Loader overlay={true} size={80} />}
      
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">{getTitle()}</Typography>
      </Box>

      {dataLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Loader size={60} />
        </Box>
      ) : (
        <>
          {type === 'department' && renderDepartmentSection()}
          {type === 'workflow' && renderWorkflowSection()}
          {type === 'map' && renderMapSection()}
        </>
      )}

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default DataCreate;
