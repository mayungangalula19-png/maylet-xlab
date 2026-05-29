import { Outlet } from 'react-router-dom'; import { Navbar } from '../../components/dashboard/Navbar'; export const RootLayout = () => { return ( <div><Navbar /><Outlet /></div> ); };
