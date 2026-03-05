import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function Layout() {
    return (
        <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-gray-100 transition-colors duration-300">
            <Header />
            {/* pt-20 to pull content down below fixed header if needed, but for Hero we might want it flush. 
          Let's assume pages handle their own top padding or we use a conditional class. 
          For now, just Outlet. The Header is fixed/transparent, so content sits BEHIND it. 
          Pages with Hero will work fine. Pages without Hero might need top padding. */}
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
