"use client";
import Layout from "../../../component/layout/layout";
import { Provider } from 'react-redux';
import store from '../../../store';

export default function FirDashboardLayout({ children }) {
    return <Layout>{children}</Layout>
}


