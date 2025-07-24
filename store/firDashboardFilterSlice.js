import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  startDate: null,
  endDate: null,
};

const firDashboardFilterSlice = createSlice({
  name: 'firDashboardFilter',
  initialState,
  reducers: {
    setFirDashboardFilters: (state, action) => {
      state.startDate = action.payload.startDate;
      state.endDate = action.payload.endDate;
    },
    clearFirDashboardFilters: (state) => {
      state.startDate = null;
      state.endDate = null;
    },
  },
});

export const { setFirDashboardFilters, clearFirDashboardFilters } = firDashboardFilterSlice.actions;
export default firDashboardFilterSlice.reducer; 