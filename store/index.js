import { configureStore } from '@reduxjs/toolkit'
import formReducer from './formSlice';
import unsafeDashboardFilterReducer from './unsafeDashboardFilterSlice';
import firDashboardFilterReducer from './firDashboardFilterSlice';

const store = configureStore({
  reducer: {
    form: formReducer,
    unsafeDashboardFilter: unsafeDashboardFilterReducer,
    firDashboardFilter: firDashboardFilterReducer
  },
})

export default store;

