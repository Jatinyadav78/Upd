import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  startDate: null,
  endDate: null,
  selectedZone: '',
};

const unsafeDashboardFilterSlice = createSlice({
  name: 'unsafeDashboardFilter',
  initialState,
  reducers: {
    setUnsafeDashboardFilters: (state, action) => {
      state.startDate = action.payload.startDate;
      state.endDate = action.payload.endDate;
      state.selectedZone = action.payload.selectedZone;
    },
    clearUnsafeDashboardFilters: (state) => {
      state.startDate = null;
      state.endDate = null;
      state.selectedZone = '';
    },
  },
});

export const { setUnsafeDashboardFilters, clearUnsafeDashboardFilters } = unsafeDashboardFilterSlice.actions;
export default unsafeDashboardFilterSlice.reducer; 