'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getLocalStorage } from '../../helperFunction/localStorage';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Collapse from '@mui/material/Collapse';

import { api } from '../../utils';

// API base URLs constants
const API_BASE_URL = `${api}v1/departments`;
const WORKFLOW_API_URL = `${api}v1/workflows`;

import {
  Button,
  Typography,
  TextField,
  Grid,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert
} from '@mui/material';
import { Card } from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import Loader from '../ui/loader/loader.js';
import DataTable, { MappingTables } from '../Table/table.js';
import Styles from './datacreate.module.css';

const DataCreate = () => {
  console.log("saddasd")
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type');
  const departmentId = searchParams.get('id'); // Store department ID from URL parameter

  // Loading states
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // State for different sections
  const [departments, setDepartments] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(departmentId || null); // Store selected department ID
  
  // Dialog states
  const [departmentDialog, setDepartmentDialog] = useState(false);
  const [workflowDialog, setWorkflowDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [editingWorkflow, setEditingWorkflow] = useState(null);

  // Get selected organization ID from localStorage
  const getSelectedOrganizationId = () => {
    const selectedOrgId = getLocalStorage('selectedOrgId');
    if (!selectedOrgId) {
      console.error('No organization selected');
      return null;
    }
    return selectedOrgId;
  };

  // Initialize form states with a function to avoid initialization order issues
  const getInitialDepartmentForm = () => ({
    name: '',
    code: '',
    organizationId: getSelectedOrganizationId()
  });

  const getInitialWorkflowForm = () => ({
    name: '',
    description: '',
    organizationId: getSelectedOrganizationId(),
    departmentId: departmentId || '',
    approvers: [],
    escalationAlert: [],
    isActive: true
  });

  // Form states
  const [departmentForm, setDepartmentForm] = useState(getInitialDepartmentForm());
  const [workflowForm, setWorkflowForm] = useState(getInitialWorkflowForm());

  // State to store cached organization names
  const [organizations, setOrganizations] = useState({});
  const [organizationLoading, setOrganizationLoading] = useState({});

  // Function to get organization name by ID (synchronous)
  const getOrganizationName = (orgId) => {
    console.log("getOrganization",orgId,organizations)
    if (!orgId) return 'N/A';
    
    // Return cached organization name if available
    if (organizations[orgId]) {
      return organizations[orgId];
    }

    // Return loading state if currently fetching
    if (organizationLoading[orgId]) {
      return 'Loading...';
    }

    // Return the ID as fallback if not cached yet
    return orgId;
  };

  // Function to get department name by ID (synchronous)
  const getDepartmentName = (deptId) => {
    if (!deptId) return 'N/A';
    
    // Find department by ID in the departments array
    const department = departments.find(dept => dept._id === deptId);
    return department ? department.name : deptId;
  };

  // Function to fetch organization data
  const fetchOrganizationName = async (orgId) => {
    if (!orgId || organizations[orgId] || organizationLoading[orgId]) {
      return;
    }

    setOrganizationLoading(prev => ({ ...prev, [orgId]: true }));

    try {
      const token = getLocalStorage('token')?.access?.token;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${api}v1/work-permit/organizations/${orgId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch organization');
      }

      const data = await response.json();
      console.log("fetcjorganixation",data)
      // Cache the organization name
      setOrganizations(prev => ({ ...prev, [orgId]: data.name }));
      
    } catch (error) {
      console.error('Error fetching organization:', error);
      // Set fallback to orgId in case of error
      setOrganizations(prev => ({ ...prev, [orgId]: orgId }));
    } finally {
      // Clear loading state
      setOrganizationLoading(prev => ({ ...prev, [orgId]: false }));
    }
  };

  // Fetch users for approvers dropdown
  const fetchUsers = async (orgId) => {
    if (!orgId) {
      console.error('No organization ID provided for fetching users');
      return;
    }
    
    try {
      setLoadingUsers(true);
      const token = getLocalStorage('token')?.access?.token;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${api}v1/organizations/${orgId}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch users');
      }
      
      const data = await response.json();
      // Transform user data to match expected format
      const formattedUsers = Array.isArray(data) ? data.map(user => ({
        _id: user._id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || ''
      })) : [];
      
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setNotification({
        open: true,
        message: error.message || 'Failed to fetch users',
        severity: 'error'
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  //  sync with navbar organization selection
  useEffect(() => {
    const selectedOrgId = getSelectedOrganizationId();
    
    if (selectedOrgId) {
      setDepartmentForm(prev => ({
        ...prev,
        organizationId: selectedOrgId
      }));
      
      setWorkflowForm(prev => ({
        ...prev,
        organizationId: selectedOrgId
      }));
      
      // Fetch data for the selected organization
      fetchDepartments(selectedOrgId);
      fetchWorkflows(selectedOrgId);
      fetchUsers(selectedOrgId);
    } else {
      console.warn('No organization selected');
      setNotification({
        open: true,
        message: 'Please select an organization first',
        severity: 'warning'
      });
    }
  }, [getSelectedOrganizationId()]); 

  // Effect to fetch organization names when departments or workflows change
  useEffect(() => {
    const orgIds = new Set();
    
    // Collect organization IDs from departments
    departments.forEach(dept => {
      if (dept.organizationId) {
        orgIds.add(dept.organizationId);
      }
    });
    
    // Collect organization IDs from workflows
    workflows?.forEach(wf => {
      if (wf?.organizationId) {
        orgIds.add(wf.organizationId);
      }
    });
    
    // Fetch organization names for all unique IDs
    orgIds.forEach(orgId => {
      fetchOrganizationName(orgId);
    });
  }, [departments, workflows]);

  // Function to handle API error
  const handleApiError = async (response) => {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Operation failed');
  };

  // API Functions
  const fetchDepartments = async (orgId = null) => {
    try {
      setDataLoading(true);
      const organizationId = orgId || getSelectedOrganizationId();
      const token = getLocalStorage('token')?.access?.token;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Updated URL 
      const response = await fetch(`${api}v1/departments/?organizationId=${organizationId}`, {
        headers:
         {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
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
        message: error.message,
        severity: 'error'
      });
    } finally {
      setDataLoading(false);
    }
  };

  const createDepartment = async (departmentData) => {
    try {
      setSubmitting(true);
      const token = getLocalStorage('token')?.access?.token;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${API_BASE_URL}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
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
        message: error.message,
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
      const token = getLocalStorage('token')?.access?.token;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
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
        message: error.message,
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
      const token = getLocalStorage('token')?.access?.token;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
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
        message: error.message,
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
      const token = getLocalStorage('token')?.access?.token;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Updated URL
      const response = await fetch(`${api}v1/departments/${id}`, {
        headers:
         {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
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
        message: error.message,
        severity: 'error'
      });
      return null;
    } finally {
      setDataLoading(false);
    }
  };

  const fetchWorkflows = async (deptId = null) => {
    try {
      setDataLoading(true);
      const token = getLocalStorage('token')?.access?.token;
      const organizationId = workflowForm.organizationId || getSelectedOrganizationId();
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      if (!organizationId) {
        console.log('No organization selected, skipping workflow fetch');
        setWorkflows([]);
        return;
      }
      
      // Use the department ID from URL parameter or passed parameter
      const targetDepartmentId = deptId || selectedDepartmentId || departmentId;
      
      // Construct the appropriate URL based on whether we have a department ID
      let url;
      if (targetDepartmentId) {
        url = `${WORKFLOW_API_URL}/dpt/${organizationId}/${targetDepartmentId}`;
      } else {
        url = `${WORKFLOW_API_URL}?organizationId=${organizationId}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch workflows');
      }
      
      const data = await response.json();
      console.log('Workflow API Response:', data); // Debug log
      
      // Handle both single object and array responses, filter out null/undefined values
      let workflowsArray = [];
      if (data) {
        if (Array.isArray(data)) {
          workflowsArray = data.filter(item => item != null);
        } else if (typeof data === 'object') {
          workflowsArray = [data];
        }
      }
      setWorkflows(workflowsArray);
      
      // Store the department ID if it was provided
      if (targetDepartmentId) {
        setSelectedDepartmentId(targetDepartmentId);
      }
    } catch (error) {
      console.error('Error fetching workflows:', error);
      setNotification({
        open: true,
        message: error.message,
        severity: 'error'
      });
    } finally {
      setDataLoading(false);
    }
  };

  const createWorkflow = async (workflowData) => {
    try {
      setSubmitting(true);
      const token = getLocalStorage('token')?.access?.token;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${WORKFLOW_API_URL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workflowData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create workflow');
      }
      
      const data = await response.json();
      setWorkflows([...workflows, data]);
      setNotification({
        open: true,
        message: 'Workflow created successfully',
        severity: 'success'
      });
      return data;
    } catch (error) {
      console.error('Error creating workflow:', error);
      setNotification({
        open: true,
        message: error.message,
        severity: 'error'
      });
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const updateWorkflow = async (workflowId, workflowData) => {
    try {
      setSubmitting(true);
      const token = getLocalStorage('token')?.access?.token;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${WORKFLOW_API_URL}/${workflowId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workflowData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update workflow');
      }
      
      const data = await response.json();
      setWorkflows(workflows?.map(wf => wf._id === workflowId ? data : wf));
      setNotification({
        open: true,
        message: 'Workflow updated successfully',
        severity: 'success'
      });
      return data;
    } catch (error) {
      console.error('Error updating workflow:', error);
      setNotification({
        open: true,
        message: error.message,
        severity: 'error'
      });
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const deleteWorkflow = async (workflowId) => {
    try {
      setSubmitting(true);
      const token = getLocalStorage('token')?.access?.token;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${WORKFLOW_API_URL}/${workflowId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete workflow');
      }
      
      setWorkflows(workflows?.filter(wf => wf._id !== workflowId));
      setNotification({
        open: true,
        message: 'Workflow deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting workflow:', error);
      setNotification({
        open: true,
        message: error.message,
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Escalation-related functions
  const addEscalationLevel = async (workflowId, escalationData) => {
    try {
      const token = getLocalStorage('token')?.access?.token;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${WORKFLOW_API_URL}/${workflowId}/escalation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(escalationData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add escalation level');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding escalation level:', error);
      throw error;
    }
  };

  const updateEscalationLevel = async (workflowId, levelId, escalationData) => {
    try {
      const token = getLocalStorage('token')?.access?.token;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${WORKFLOW_API_URL}/${workflowId}/escalation/${levelId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(escalationData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update escalation level');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating escalation level:', error);
      throw error;
    }
  };

  const deleteEscalationLevel = async (workflowId, levelId) => {
    try {
      const token = getLocalStorage('token')?.access?.token;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${WORKFLOW_API_URL}/${workflowId}/escalation/${levelId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete escalation level');
      }
    } catch (error) {
      console.error('Error deleting escalation level:', error);
      throw error;
    }
  };

  const getEscalationLevels = async (workflowId) => {
    try {
      const token = getLocalStorage('token')?.access?.token;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${WORKFLOW_API_URL}/${workflowId}/escalation`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get escalation levels');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting escalation levels:', error);
      throw error;
    }
  };

  // Approver-related functions
  const addWorkflowApprovers = async (workflowId, approvers) => {
    try {
      const token = getLocalStorage('token')?.access?.token;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${WORKFLOW_API_URL}/${workflowId}/approvers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ approvers }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add approvers');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding approvers:', error);
      throw error;
    }
  };

  const updateApprover = async (workflowId, approverId, approverData) => {
    try {
      const token = getLocalStorage('token')?.access?.token;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${WORKFLOW_API_URL}/${workflowId}/approvers/${approverId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(approverData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update approver');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating approver:', error);
      throw error;
    }
  };

  const deleteApprover = async (workflowId, approverId) => {
    try {
      const token = getLocalStorage('token')?.access?.token;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${WORKFLOW_API_URL}/${workflowId}/approvers/${approverId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete approver');
      }
    } catch (error) {
      console.error('Error deleting approver:', error);
      throw error;
    }
  };

  const getApprovers = async (workflowId) => {
    try {
      const token = getLocalStorage('token')?.access?.token;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${WORKFLOW_API_URL}/${workflowId}/approvers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get approvers');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting approvers:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (type === 'department') {
      fetchDepartments();
    } else if (type === 'workflow') {
      // Use department ID from URL parameter if available
      fetchWorkflows(departmentId);
    }
  }, [type, departmentId]);

  const handleBack = () => {
    setLoading(true);
    setTimeout(() => {
      router.push('/usermanagement');
    }, 300);
  };

  // Function to handle department form submission
  const handleDepartmentSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Ensure we have a valid organization ID
      const orgId = departmentForm.organizationId || getSelectedOrganizationId();
      if (!orgId) {
        throw new Error('Please select an organization first');
      }

      const departmentData = {
        ...departmentForm,
        organizationId: orgId
      };

      if (editingDepartment) {
        await updateDepartment(editingDepartment._id, departmentData);
      } else {
        await createDepartment(departmentData);
      }
      
      setDepartmentDialog(false);
      setDepartmentForm({ name: '', code: '', organizationId: orgId });
      setEditingDepartment(null);
      fetchDepartments(orgId);
      
      setNotification({
        open: true,
        message: `Department ${editingDepartment ? 'updated' : 'created'} successfully`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving department:', error);
      setNotification({
        open: true,
        message: error.message || 'Failed to save department. Please try again.',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWorkflowSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Ensure we have a valid organization ID
      const orgId = workflowForm.organizationId || getSelectedOrganizationId();
      if (!orgId) {
        throw new Error('Please select an organization first');
      }

      const workflowData = {
        ...workflowForm,
        organizationId: orgId
      };

      if (editingWorkflow) {
        await updateWorkflow(editingWorkflow._id, workflowData);
      } else {
        await createWorkflow(workflowData);
      }
      
      setWorkflowDialog(false);
      setWorkflowForm({
        name: '',
        description: '',
        organizationId: orgId,
        departmentId: departmentId || '',
        approvers: [],
        escalationAlert: [],
        isActive: true
      });
      setEditingWorkflow(null);
      fetchWorkflows(orgId);
      
      setNotification({
        open: true,
        message: `Workflow ${editingWorkflow ? 'updated' : 'created'} successfully`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving workflow:', error);
      setNotification({
        open: true,
        message: error.message || 'Failed to save workflow. Please try again.',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
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
    if (!workflow) {
      console.error('Cannot edit workflow: workflow data is null or undefined');
      return;
    }
    
    setEditingWorkflow(workflow);
    setWorkflowForm({
      name: workflow.name || '',
      description: workflow.description || '',
      organizationId: workflow.organizationId || '',
      departmentId: workflow.departmentId || departmentId || '',
      approvers: workflow.approvers || [],
      escalationAlert: workflow.escalationAlert || [],
      isActive: workflow.isActive !== undefined ? workflow.isActive : true
    });
    setWorkflowDialog(true);
  };

  const handleDeleteDepartment = (id) => {
    if (window.confirm('Are you sure you want to delete this department? This action cannot be undone and may affect related workflows.')) {
      deleteDepartment(id).catch(error => {
        console.error('Error in handleDeleteDepartment:', error);
        // Error notification is already handled in deleteDepartment function
      });
    }
  };

  const handleDeleteWorkflow = (id) => {
    if (!id) {
      console.error('Cannot delete workflow: ID is null or undefined');
      setNotification({
        open: true,
        message: 'Cannot delete workflow: Invalid ID',
        severity: 'error'
      });
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      deleteWorkflow(id).catch(error => {
        console.error('Error in handleDeleteWorkflow:', error);
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const renderDepartmentSection = () => {
    // Define columns for department table
    const departmentColumns = [
      { field: 'name', headerName: 'Name ↑', type: 'text' },
      { field: '_id', headerName: 'Id', type: 'text' },
      { field: 'code', headerName: 'Code', type: 'text' },
      { field: 'organizationId', headerName: 'Organization Id', type: 'organization' },
      { field: 'updatedAt', headerName: 'Updated At', type: 'date' },
      { field: 'createdAt', headerName: 'Created At', type: 'date' },
      { field: 'workflow', headerName: 'Workflow', type: 'button', label: 'Workflow', action: 'workflow' },
      { field: 'actions', headerName: 'Actions', type: 'actions' }
    ];

    const handleDepartmentRowAction = (action, row) => {
      if (action === 'workflow') {
        router.push(`/datacreate?type=workflow&id=${row._id}`);
      }
    };

    return (
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

        <DataTable
          columns={departmentColumns}
          data={departments}
          onEdit={handleEditDepartment}
          onDelete={handleDeleteDepartment}
          onRowAction={handleDepartmentRowAction}
          submitting={submitting}
          showCheckbox={true}
          getOrganizationName={getOrganizationName}
        />

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
              disabled={submitting || !departmentForm.name || !departmentForm.code}
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
  };

  const renderWorkflowSection = () => {
    // Define columns for workflow table
    const workflowColumns = [
      { field: 'name', headerName: 'Name ↑', type: 'text' },
      { field: '_id', headerName: 'Id', type: 'text' },
      { field: 'organizationId', headerName: 'Organization Id', type: 'organization' },
      { field: 'departmentId', headerName: 'Department Name', type: 'department' },
      { field: 'description', headerName: 'Description', type: 'text' },
      { field: 'approvers', headerName: 'Approvers', type: 'count', suffix: 'Approvers' },
      { field: 'escalationAlert', headerName: 'Escalation Alert', type: 'count', suffix: 'Alerts' },
      { field: 'isActive', headerName: 'Is Active', type: 'chip' },
      { field: 'actions', headerName: 'Actions', type: 'actions' }
    ];

    return (
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
              {workflows?.length}
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

        <DataTable
          columns={workflowColumns}
          data={workflows?.filter(wf => wf != null) || []}
          onEdit={handleEditWorkflow}
          onDelete={handleDeleteWorkflow}
          submitting={submitting}
          showCheckbox={true}
          getOrganizationName={getOrganizationName}
          getDepartmentName={getDepartmentName}
        />

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
                <InputLabel>Department Id</InputLabel>
                <Select
                  value={workflowForm.departmentId}
                  onChange={(e) => setWorkflowForm({ ...workflowForm, departmentId: e.target.value })}
                  label="Department Id"
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept._id} value={dept._id}>
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
                        <InputLabel>Select Approver</InputLabel>
                        <Select
                          value={approver.userId || ''}
                          onChange={(e) => {
                            const newApprovers = [...workflowForm.approvers];
                            const selectedUser = users.find(user => user._id === e.target.value);
                            newApprovers[index] = {
                              ...newApprovers[index],
                              userId: e.target.value,
                              email: selectedUser?.email || '',
                              name: selectedUser?.name || ''
                            };
                            setWorkflowForm({ ...workflowForm, approvers: newApprovers });
                          }}
                          label="Select Approver"
                          renderValue={(selected) => {
                            const selectedUser = users.find(user => user._id === selected);
                            return selectedUser?.name || selectedUser?.email || '';
                          }}
                        >
                          <MenuItem value="">
                            <em>Select a user</em>
                          </MenuItem>
                          {loadingUsers ? (
                            <MenuItem disabled>Loading users...</MenuItem>
                          ) : users.length > 0 ? (
                            users.map((user) => (
                              <MenuItem key={user._id} value={user._id}>
                                <Box>
                                  <div>{user.name || user.email}</div>
                                  {user.email && <div style={{ fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)' }}>{user.email}</div>}
                                </Box>
                              </MenuItem>
                            ))
                          ) : (
                            <MenuItem disabled>No users found in this organization</MenuItem>
                          )}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Approver's Email"
                        value={approver.email || ''}
                        onChange={(e) => {
                          const newApprovers = [...workflowForm.approvers];
                          newApprovers[index].email = e.target.value;
                          setWorkflowForm({ ...workflowForm, approvers: newApprovers });
                        }}
                        disabled={!!approver.userId} // Disable if user is selected from dropdown
                        helperText={approver.userId ? 'Email is linked to the selected user' : 'Enter email for external approver'}
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
                      <FormControl fullWidth>
                        <InputLabel>Approvers Status</InputLabel>
                        <Select
                          value={approver.status}
                          onChange={(e) => {
                            const newApprovers = [...workflowForm.approvers];
                            newApprovers[index].status = e.target.value;
                            setWorkflowForm({ ...workflowForm, approvers: newApprovers });
                          }}
                          label="Approvers Status"
                        >
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="approved">Approved</MenuItem>
                          <MenuItem value="rejected">Rejected</MenuItem>
                        </Select>
                      </FormControl>
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
                 Add New Item
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Escalation Alert</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => {
                  const newAlerts = [...workflowForm.escalationAlert];
                  newAlerts.push({
                    level: '',
                    emails: [''],
                    timeout: '',
                    reminderInterval: '',
                    maxReminders: ''
                  });
                  setWorkflowForm({ ...workflowForm, escalationAlert: newAlerts });
                }}
                size="small"
                sx={{ 
                  mb: 2,
                  borderColor: '#1976d2',
                  color: '#1976d2',
                  '&:hover': {
                    borderColor: '#1565c0',
                    backgroundColor: '#e3f2fd'
                  }
                }}
              >
                Add New Item
              </Button>
                
                {workflowForm.escalationAlert.map((alert, index) => (
                  <Card key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="subtitle1">[{index + 1}]</Typography>
                      <IconButton 
                        color="error" 
                        onClick={() => {
                          const newAlerts = workflowForm.escalationAlert.filter((_, i) => i !== index);
                          setWorkflowForm({ ...workflowForm, escalationAlert: newAlerts });
                        }}
                        disabled={workflowForm.escalationAlert.length <= 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    

                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, color: '#1976d2' }}>
                            * Escalation Alert Level
                          </Typography>
                          <TextField
                            fullWidth
                            type="number"
                            value={alert.level || ''}
                            placeholder="Enter level"
                            onChange={(e) => {
                              const newAlerts = [...workflowForm.escalationAlert];
                              newAlerts[index].level = e.target.value ? parseInt(e.target.value) : '';
                              setWorkflowForm({ ...workflowForm, escalationAlert: newAlerts });
                            }}
                            inputProps={{ min: 1 }}
                            variant="outlined"
                            size="small"
                            sx={{ backgroundColor: '#fff' }}
                          />
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, color: '#1976d2' }}>
                            * Escalation Alert Emails
                          </Typography>
                          <Box 
                            sx={{ 
                              border: '1px solid #e0e0e0', 
                              borderRadius: '4px', 
                              p: 2, 
                              backgroundColor: '#f8f9fa',
                              borderLeft: '3px solid #42a5f5'
                            }}
                          >
                            {alert.emails?.map((email, emailIndex) => (
                              <Box key={emailIndex} display="flex" alignItems="center" mb={1}>
                                <TextField
                                  fullWidth
                                  value={email}
                                  onChange={(e) => {
                                    const newAlerts = [...workflowForm.escalationAlert];
                                    newAlerts[index].emails[emailIndex] = e.target.value;
                                    setWorkflowForm({ ...workflowForm, escalationAlert: newAlerts });
                                  }}
                                  placeholder="email@example.com"
                                  variant="outlined"
                                  size="small"
                                  sx={{ 
                                    backgroundColor: '#fff',
                                    '& .MuiOutlinedInput-root': {
                                      '& fieldset': {
                                        borderColor: '#e0e0e0',
                                      },
                                      '&:hover fieldset': {
                                        borderColor: '#90caf9',
                                      },
                                    },
                                  }}
                                />
                                <IconButton 
                                  size="small" 
                                  onClick={() => {
                                    const newAlerts = [...workflowForm.escalationAlert];
                                    newAlerts[index].emails.splice(emailIndex, 1);
                                    setWorkflowForm({ ...workflowForm, escalationAlert: newAlerts });
                                  }}
                                  sx={{ ml: 1, color: '#f44336' }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            ))}
                            <Button
                              variant="outlined"
                              startIcon={<AddIcon />}
                              onClick={() => {
                                const newAlerts = [...workflowForm.escalationAlert];
                                if (!newAlerts[index].emails) {
                                  newAlerts[index].emails = [];
                                }
                                newAlerts[index].emails.push('');
                                setWorkflowForm({ ...workflowForm, escalationAlert: newAlerts });
                              }}
                              size="small"
                              sx={{ 
                                mt: 1,
                                borderColor: '#42a5f5',
                                color: '#42a5f5',
                                fontSize: '0.75rem',
                                '&:hover': {
                                  borderColor: '#1e88e5',
                                  backgroundColor: '#e3f2fd'
                                }
                              }}
                            >
                              + Add Email
                            </Button>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, color: '#1976d2' }}>
                            * Escalation Alert Timeout
                          </Typography>
                          <TextField
                            fullWidth
                            type="number"
                            value={alert.timeout || ''}
                            placeholder="Enter timeout in hours"
                            onChange={(e) => {
                              const newAlerts = [...workflowForm.escalationAlert];
                              newAlerts[index].timeout = e.target.value ? parseInt(e.target.value) : '';
                              setWorkflowForm({ ...workflowForm, escalationAlert: newAlerts });
                            }}
                            inputProps={{ min: 1 }}
                            variant="outlined"
                            size="small"
                            sx={{ backgroundColor: '#fff' }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, color: '#1976d2' }}>
                            * Escalation Alert Reminder Interval
                          </Typography>
                          <TextField
                            fullWidth
                            type="number"
                            value={alert.reminderInterval || ''}
                            placeholder="Enter interval in hours"
                            onChange={(e) => {
                              const newAlerts = [...workflowForm.escalationAlert];
                              newAlerts[index].reminderInterval = parseInt(e.target.value) || 0;
                              setWorkflowForm({ ...workflowForm, escalationAlert: newAlerts });
                            }}
                            inputProps={{ min: 1 }}
                            variant="outlined"
                            size="small"
                            sx={{ backgroundColor: '#fff' }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, color: '#1976d2' }}>
                            * Escalation Alert Max Reminders
                          </Typography>
                          <TextField
                            fullWidth
                            type="number"
                            value={alert.maxReminders || ''}
                            placeholder="Enter max reminders"
                            onChange={(e) => {
                              const newAlerts = [...workflowForm.escalationAlert];
                              newAlerts[index].maxReminders = parseInt(e.target.value) || 0;
                              setWorkflowForm({ ...workflowForm, escalationAlert: newAlerts });
                            }}
                            inputProps={{ min: 1 }}
                            variant="outlined"
                            size="small"
                            sx={{ backgroundColor: '#fff' }}
                          />
                        </Grid>
                      </Grid>
                  </Card>
                ))}
            </Grid>

            <Grid container spacing={2}>
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
};

  const renderMapSection = () => {
    // Define columns for departments table in mapping section
    const mapDepartmentColumns = [
      { field: 'name', headerName: 'Name', type: 'text' },
      { field: 'code', headerName: 'Code', type: 'text' },
      { field: 'organizationId', headerName: 'Organization Id', type: 'organization' }
    ];

    // Define columns for workflows table in mapping section
    const mapWorkflowColumns = [
      { field: 'name', headerName: 'Name', type: 'text' },
      { field: 'departmentId', headerName: 'Department Name', type: 'department' },
      { field: 'description', headerName: 'Description', type: 'text' }
    ];

    // Define columns for mappings table
    const mappingColumns = [
      { field: 'department', headerName: 'Department', type: 'text' },
      { field: 'workflow', headerName: 'Workflow', type: 'text' },
      { field: 'organizationId', headerName: 'Organization Id', type: 'organization' },
      { field: 'approvers', headerName: 'Approvers', type: 'count', suffix: 'Approvers' },
      { field: 'status', headerName: 'Status', type: 'chip' },
      { field: 'actions', headerName: 'Actions', type: 'actions' }
    ];

    // Transform mappings data to include approvers count
    const transformedMappings = mappings.map(mapping => ({
      ...mapping,
      approvers: workflows?.find(wf => wf.name === mapping.workflow)?.approvers || [],
      organizationId: 'Thirdeye-Ai' // This seems to be hardcoded in the original
    }));

    return (
      <div>
        <Box display="flex" alignItems="center" mb={2}>
          <Typography variant="body2" color="textSecondary">
            Dashboard / Department-Workflow Mapping
          </Typography>
        </Box>

        <Typography variant="h4" mb={3}>Map Department</Typography>
        
        <MappingTables
          departments={departments}
          workflows={workflows}
          mappings={mappings}
          departmentColumns={mapDepartmentColumns}
          workflowColumns={mapWorkflowColumns}
          mappingColumns={mappingColumns}
          transformedMappings={transformedMappings}
          getOrganizationName={getOrganizationName}
          getDepartmentName={getDepartmentName}
        />
      </div>
    );
  };

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
