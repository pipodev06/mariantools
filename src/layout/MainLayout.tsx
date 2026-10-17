import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import RouteSeo from "../components/RouteSeo";
import ScrollToTop from "../components/ScrollToTop";
import ToolExtras from "../components/ToolExtras";
import RecentTracker from "../components/RecentTracker";

const MainLayout = () => {
  return (
    <div className="flex min-h-dvh flex-col">
      <RouteSeo />
      <ScrollToTop />
      <Header />

      <main className="flex-1 bg-slate-50 dark:bg-slate-950">
        <RecentTracker />
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
        <ToolExtras />
      </main>

      <Footer />
    </div>
  );
};

export default MainLayout;