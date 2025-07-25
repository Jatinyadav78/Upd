import React, { useState, useEffect } from 'react';
import Styles from './dashboardHome.module.css';
import DashboardDesign from '../../public/dashboardDesign.svg';
import dynamic from 'next/dynamic';
import { Box, Grid, Card, CardContent, Typography, Button, Stack, Popover, Chip } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { getLocalStorage } from '../../helperFunction/localStorage';
import { api as API_URL } from '../../utils';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { setFirDashboardFilters } from '../../store/firDashboardFilterSlice';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CircularProgress from '@mui/material/CircularProgress';
import Image from 'next/image';
import notFoundError from '../../public/notFoundError.svg';

// Add fixed incident categories for the x-axis
const INCIDENT_CATEGORIES = [
  'Major A',
  'Major B',
  'Fatal',
  'Minor',
  'First Aid',
  'Major Fire',
  'Minor Fire'
];

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const FirDashboard = () => {
  const router = useRouter();
  // Add state for filter and data
  const [anchorEl, setAnchorEl] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const dispatch = useDispatch();
  const firDashboardFilters = useSelector(state => state.firDashboardFilter);

  // On mount, initialize local state from Redux if present
  useEffect(() => {
    if (firDashboardFilters) {
      if (firDashboardFilters.startDate) setStartDate(dayjs(firDashboardFilters.startDate));
      if (firDashboardFilters.endDate) setEndDate(dayjs(firDashboardFilters.endDate));
    }
  }, []);

  // Fetch initial data
  useEffect(() => {
    // Get current month's date range
    const now = dayjs();
    const startOfMonth = now.startOf('month').format('YYYY-MM-DD');
    const currentDate = now.format('YYYY-MM-DD');
    
    // Set the date states
    setStartDate(dayjs(startOfMonth));
    setEndDate(now);
    
    // Fetch data with date range
    fetchFirData(startOfMonth, currentDate);
  }, []);

  const fetchFirData = async (start = null, end = null) => {
    try {
      const token = getLocalStorage('token')?.access?.token;
      // const orgId = getLocalStorage('user')?.organizationId?.[0]?._id;
      // const orgId = getLocalStorage('user')?.organizationId;
      const orgId = getLocalStorage('selectedOrgId');
      console.log(getLocalStorage('user'), 'user')
      let url = `${API_URL}v1/safety/incidence?orgId=${orgId}`;
      
      if (start) {
        url += `&startDate=${start}`;
      }
      if (end) {
        url += `&endDate=${end}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const responseData = await response.json();
        setData(responseData);
        setFilteredData(responseData);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching FIR data:', error);
      setLoading(false);
    }
  };

  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const handleApplyFilter = () => {
    if (startDate && endDate) {
      const start = dayjs(startDate).startOf('day');
      const end = dayjs(endDate).endOf('day');
      
      // Format dates for API
      const formattedStartDate = start.format('YYYY-MM-DD');
      const formattedEndDate = end.format('YYYY-MM-DD');
      
      // Fetch filtered data from API
      fetchFirData(formattedStartDate, formattedEndDate);
      // Update Redux filter state
      dispatch(setFirDashboardFilters({
        startDate: formattedStartDate,
        endDate: formattedEndDate
      }));
    }
    handleFilterClose();
    // Also update Redux filter state in case only one date changed
    if (!startDate || !endDate) {
      dispatch(setFirDashboardFilters({
        startDate: startDate ? dayjs(startDate).format('YYYY-MM-DD') : null,
        endDate: endDate ? dayjs(endDate).format('YYYY-MM-DD') : null
      }));
    }
  };

  // Add handleFirForm function
  const handleFirForm = () => {
    // const orgId = getLocalStorage('user')?.organizationId?.[0]?._id;
    // const orgId = getLocalStorage('user')?.organizationId;
     const orgId = getLocalStorage('selectedOrgId');
    const firFormId = '68246de56f19ea240cf88b12';
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 6);
    const url = `${window.location.origin}/home?id=${firFormId}&orgId=${orgId}&till=${expiryDate.toISOString()}`;
    window.open(url, '_blank');
  };

  // Process data for cause distribution
  const causeData = filteredData.reduce((acc, item) => {
    const cause = item.cause || "Unknown";
    acc[cause] = (acc[cause] || 0) + 1;
    return acc;
  }, {});

  // Process data for treatment types
  const treatmentData = filteredData.reduce((acc, item) => {
    const treatment = item.treatment || "Unknown";
    acc[treatment] = (acc[treatment] || 0) + 1;
    return acc;
  }, {});

  // Process data for PPE Status
  const ppeData = filteredData.reduce((acc, item) => {
    const ppe = item.ppeStatus || "Unknown";
    acc[ppe] = (acc[ppe] || 0) + 1;
    return acc;
  }, {});

  // Process data for experience levels
  const experienceData = filteredData.reduce((acc, item) => {
    const exp = item.experience || "Unknown";
    acc[exp] = (acc[exp] || 0) + 1;
    return acc;
  }, {});

  // Process data for IP Status
  const ipStatusData = filteredData.reduce((acc, item) => {
    const status = item.ipStatus || "Unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Calculate summary metrics
  const summaryMetrics = {
    totalIncidents: filteredData.length,
    // Count for each incident category
    categoryCounts: filteredData.reduce((acc, item) => {
      const cat = item.incidenceCategory || 'Unknown';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {}),
  };
  // fixed categories for the x-axis
  const allCategories = INCIDENT_CATEGORIES;
  
  const chartCategoryData = INCIDENT_CATEGORIES.map(cat => summaryMetrics.categoryCounts[cat] || 0);

  const chartConfigs = {
    cause: {
      options: {
        chart: { 
          type: 'pie',
          fontFamily: 'inherit'
        },
        title: { 
          text: 'Incident Causes',
          style: {
            fontSize: '18px',
            fontWeight: 600,
            fontFamily: 'inherit'
          }
        },
        labels: Object.keys(causeData),
        colors: ['#4361ee', '#0c7fddff', '#285ad7ff', '#95a8ff', '#b8c3ff'],
        legend: {
          position: 'bottom',
          fontSize: '14px',
          fontFamily: 'inherit'
        },
        plotOptions: {
          pie: {
            donut: {
              size: '50%'
            }
          }
        }
      },
      series: Object.values(causeData)
    },
    treatment: {
      options: {
        chart: { 
          type: 'donut',
          fontFamily: 'inherit'
        },
        title: { 
          text: 'Treatment Types',
          style: {
            fontSize: '18px',
            fontWeight: 600,
            fontFamily: 'inherit'
          }
        },
        labels: Object.keys(treatmentData),
        colors: ['#FF9800', '#FFB74D', '#FFCC80', '#FFE0B2'],
        legend: {
          position: 'bottom',
          fontSize: '14px',
          fontFamily: 'inherit'
        },
        plotOptions: {
          pie: {
            donut: {
              size: '60%'
            }
          }
        }
      },
      series: Object.values(treatmentData)
    },
   ppe: {
  options: {
    chart: { type: 'pie' },
    title: {
      text: 'PPE Status Distribution',
      style: {
        fontSize: '18px',
        fontWeight: 600,
        fontFamily: 'inherit'
      }
    },
    labels: Object.keys(ppeData),
    colors: ['#4CAF50', '#f44336'],
    legend: {
      position: 'bottom',
      fontSize: '14px',
      // fontWeight: 600,
      fontFamily: 'inherit',
      labels: {
        colors: '#000' // Optional: make legend text black
      }
    }
  },
  series: Object.values(ppeData)
},

    experience: {
      options: {
        chart: { 
          type: 'bar',
          toolbar: {
            show: false
          },
          fontFamily: 'inherit'
        },
        title: { 
          text: 'Experience Level Distribution',
          style: {
            fontSize: '18px',
            fontWeight: 600,
            fontFamily: 'inherit'
          }
        },
        xaxis: { 
          categories: Object.keys(experienceData),
          labels: {
            style: {
              fontSize: '12px',
              fontFamily: 'inherit'
            }
          }
        },
        // Use a different color for each bar
        colors: Object.keys(experienceData).map((_, idx) => {
          const palette = [
            '#48cae4', // blue
            '#ffb703', // yellow
            '#fb8500', // orange
            '#219ebc', // teal
            '#8ecae6', // light blue
            '#ff006e', // pink
            '#8338ec', // purple
            '#3a86ff', // deep blue
            '#06d6a0', // green
            '#ffd166', // light yellow
            '#ef476f', // red
            '#118ab2', // blue-green
            '#073b4c'  // dark blue
          ];
          return palette[idx % palette.length];
        }),
        plotOptions: {
          bar: {
            borderRadius: 8,
            columnWidth: '60%',
            horizontal: false,
            distributed: true // This enables per-bar coloring
          }
        },
        dataLabels: {
          enabled: false
        },
        grid: {
          borderColor: '#f1f1f1'
        }
      },
      series: [{ name: 'Incidents', data: Object.values(experienceData) }]
    },
    ipStatus: {
      options: {
        chart: { 
          type: 'donut',
          fontFamily: 'inherit'
        },
        title: { 
          text: 'IP Status Distribution',
          style: {
            fontSize: '18px',
            fontWeight: 600,
            fontFamily: 'inherit'
          }
        },
        labels: Object.keys(ipStatusData),
        colors: ['#4CAF50', '#81C784', '#A5D6A7'],
        legend: {
          position: 'bottom',
          fontSize: '14px',
          fontFamily: 'inherit'
        },
        plotOptions: {
          pie: {
            donut: {
              size: '60%'
            }
          }
        }
      },
      series: Object.values(ipStatusData)
    }
  };

  const handleViewAllIncidents = () => {
    setCardLoading(true);
    try {
    // Store the current data and filters
    localStorage.setItem('firIncidentsData', JSON.stringify(filteredData));
    localStorage.setItem('fromFirDashboard', 'true');
    
    // Store date filters if they exist
    if (startDate && endDate) {
      localStorage.setItem('firDateFilters', JSON.stringify({
        startDate: dayjs(startDate).format('YYYY-MM-DD'),
        endDate: dayjs(endDate).format('YYYY-MM-DD')
      }));
    }
    
    // Navigate to the status page
    router.push('/safety-conditions/all');
    } catch (error) {
      console.error('Error navigating:', error);
      setError(true);
    }
  };

  // Add function to remove date filter
  const removeDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
    fetchFirData();
  };

  const removeAllFilters = () => {
    setStartDate(null);
    setEndDate(null);
    fetchFirData();
  };

  // Check if any filters are active
  const hasActiveFilters = startDate || endDate;

  // Adjustable filter chip spacing
  const FILTER_CHIP_MARGIN_TOP = 1;   // px
  const FILTER_CHIP_MARGIN_BOTTOM = 12; // px

  // When date changes, update Redux filter state
  useEffect(() => {
    dispatch(setFirDashboardFilters({
      startDate: startDate ? dayjs(startDate).format('YYYY-MM-DD') : null,
      endDate: endDate ? dayjs(endDate).format('YYYY-MM-DD') : null
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <Image
          src={notFoundError}
          alt="Error"
          width={300}
          height={300}
          priority
        />
        <Typography variant="h5" sx={{ color: '#64748b' }}>
          Something went wrong. Please try again later.
        </Typography>
      </Box>
    );
  }

  return (
    <div className={Styles.dashboardContainer}>
      <Image className={Styles.dashboardImage} priority src={DashboardDesign} alt="submitted" />
      <Box
        p={3}
        sx={{
          backgroundColor: '#f8fafc',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
        className={Styles.main}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.1, width: '100%', maxWidth: 1200, mx: 'auto' }}>
        <Typography className={Styles.title} variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
          FIR Dashboard Analytics
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<FilterListIcon />}
            onClick={handleFilterClick}
            sx={{ backgroundColor: '#0073FF' }}
            disabled={loading}
          >
            Filter
          </Button>
          <Popover
            id={Boolean(anchorEl) ? 'filter-popover' : undefined}
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={handleFilterClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
          >
            <Box sx={{ p: 2, width: '300px' }}>
              <Stack spacing={2}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </LocalizationProvider>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setStartDate(null);
                      setEndDate(null);
                      setAnchorEl(null);
                      fetchFirData();
                    }}
                    fullWidth
                    color="error"
                  >
                    Reset
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleApplyFilter}
                    fullWidth
                    style={{ backgroundColor: '#0073FF' }}
                  >
                    Apply Filter
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Popover>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleFirForm}
            sx={{ backgroundColor: '#0073FF' }}
          >
            FIR Form
          </Button>
        </Stack>
      </Box>

      {/* Filter Chips */}
      {hasActiveFilters && (
        <Box sx={{ 
          mt: `${FILTER_CHIP_MARGIN_TOP}px`,
          mb: '1px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          alignItems: 'center',
          width: '100%',
          maxWidth: 1200,
          mx: 'auto'
        }}>
          <Typography variant="body2" sx={{ 
            color: '#64748b', 
            fontWeight: 500, 
            mr: 1,
            fontSize: '0.875rem'
          }}>
            Active Filters:
          </Typography>
          {/* Date Range Chip */}
          {(startDate || endDate) && (
            <Chip
              label={`${startDate ? dayjs(startDate).format('MMM DD, YYYY') : 'Start'} - ${endDate ? dayjs(endDate).format('MMM DD, YYYY') : 'End'}`}
              onDelete={removeDateFilter}
              sx={{
                backgroundColor: '#0073FF',
                color: '#fff',
                fontWeight: 600,
                border: 'none',
                '& .MuiChip-deleteIcon': {
                  color: '#fff',
                  '&:hover': {
                    color: '#dc2626'
                  }
                },
                '&:hover': {
                  backgroundColor: '#0059B2'
                }
              }}
            />
          )}
          {/* Clear All Button */}
          <Button
            variant="text"
            size="small"
            onClick={removeAllFilters}
            sx={{
              color: '#64748b',
              fontWeight: 500,
              fontSize: '0.75rem',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(38, 163, 182, 0.04)',
                color: '#dc2626'
              },
            }}
          >
            Clear All
          </Button>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <Typography variant="h6" sx={{ color: '#64748b' }}>Loading FIR data...</Typography>
        </Box>
      ) : filteredData.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <Typography variant="h6" sx={{ color: '#64748b' }}>No FIR data available for the selected period</Typography>
        </Box>
      ) : (
        <>
          {/* Responsive Grid for All Cards */}
          <Grid container spacing={3} sx={{ width: '100%', maxWidth: 1400, mx: 'auto', mt: 2, mb: 1, justifyContent: 'center' }}>
            {/* Incident Categories Graph Card (Full Width) */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3, boxShadow: 3, background: '#fff', height: 420, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 6 } }}>
                <CardContent sx={{ height: '100%', position: 'relative', pb: 2 }}>
                  {/* Total Incidents Button at top right */}
                  <Button
                    variant="contained"
                    onClick={handleViewAllIncidents}
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      background: 'linear-gradient(45deg, #4361ee, #3f8cff)',
                      color: '#fff',
                      fontWeight: 700,
                      borderRadius: '24px',
                      boxShadow: '0 2px 8px rgba(50, 198, 203, 0.1)',
                      zIndex: 2,
                      px: 1.5,
                      py: 1.2,
                      minWidth: 0,
                      minHeight: 0,
                      fontSize: '1.1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': { background: 'linear-gradient(45deg, #3f8cff, #4361ee)', boxShadow: '0 4px 16px rgba(33, 139, 188, 0.82)' }
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff', mr: 1 }}>Total Incidents</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', mr: 1 }}>{summaryMetrics.totalIncidents}</Typography>
                    {cardLoading ? (
                      <CircularProgress size={20} sx={{ color: '#fff', ml: 1 }} />
                    ) : (
                      <OpenInNewIcon sx={{ color: '#fff', opacity: 0.9, ml: 1 }} />
                    )}
                  </Button>
                  <Typography variant="h6" sx={{ color: '#232946', fontWeight: 600, mb: 2, textAlign: 'left', letterSpacing: 0.5, mt: 1, fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                    Incident Categories
                  </Typography>
                  <Box sx={{ width: '100%', height: 320, mt: 2 }}>
                    <Chart
                      options={{
                        ...chartConfigs.incidentCategoryOptions,
                        chart: {
                          ...chartConfigs.incidentCategoryOptions?.chart,
                          type: 'line',
                          background: '#fff',
                          toolbar: { show: false },
                          zoom: { enabled: false },
                        },
                        theme: { mode: 'light' },
                        xaxis: {
                          categories: allCategories,
                          labels: { style: { colors: '#232946', fontSize: '14px' } },
                          axisBorder: { show: false },
                          axisTicks: { show: false },
                          tickAmount: allCategories.length,
                          min: 0,
                        },
                        yaxis: {
                          min: 0,
                          labels: { style: { colors: '#232946', fontSize: '14px' } },
                          axisBorder: { show: false },
                          axisTicks: { show: false },
                          forceNiceScale: true,
                          tickAmount: 6,
                        },
                        grid: { borderColor: '#e0e7ef', strokeDashArray: 4, padding: { left: 24, right: 24, top: 16, bottom: 16 } },
                        stroke: { curve: 'smooth', width: 3, colors: ['#2196f3'] },
                        markers: { size: 6, colors: ['#2196f3'] },
                        colors: ['#2196f3'],
                        legend: { show: false },
                        tooltip: { theme: 'light', style: { fontSize: '14px', color: '#232946' } }
                      }}
                      series={[{
                        name: 'Incidents',
                        data: chartCategoryData
                      }]}
                      type="line"
                      height={320}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            {/* Other Cards Responsive */}
            <Grid item xs={12} sm={6} lg={4}>
              <Card sx={{ backgroundColor: '#ffffff', borderRadius: 3, boxShadow: 3, height: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 6 } }}>
                <CardContent sx={{ p: 3, height: '100%' }}>
                  <Chart
                    options={chartConfigs.cause.options}
                    series={chartConfigs.cause.series}
                    type="pie"
                    height={300}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} lg={4}>
              <Card sx={{ backgroundColor: '#ffffff', borderRadius: 3, boxShadow: 3, height: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 6 } }}>
                <CardContent sx={{ p: 3, height: '100%' }}>
                  <Chart
                    options={chartConfigs.treatment.options}
                    series={chartConfigs.treatment.series}
                    type="donut"
                    height={300}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} lg={4}>
              <Card sx={{ backgroundColor: '#ffffff', borderRadius: 3, boxShadow: 3, height: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 6 } }}>
                <CardContent sx={{ p: 3, height: '100%' }}>
                  <Chart
                    options={chartConfigs.ppe.options}
                    series={chartConfigs.ppe.series}
                    type="pie"
                    height={300}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} lg={6}>
              <Card sx={{ backgroundColor: '#ffffff', borderRadius: 3, boxShadow: 3, height: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 6 } }}>
                <CardContent sx={{ p: 3, height: '100%' }}>
                  <Chart
                    options={chartConfigs.experience.options}
                    series={chartConfigs.experience.series}
                    type="bar"
                    height={300}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} lg={6}>
              <Card sx={{ backgroundColor: '#ffffff', borderRadius: 3, boxShadow: 3, height: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 6 } }}>
                <CardContent sx={{ p: 3, height: '100%' }}>
                  <Chart
                    options={chartConfigs.ipStatus.options}
                    series={chartConfigs.ipStatus.series}
                    type="donut"
                    height={300}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
    </div>
  );
};

export default FirDashboard; 






