import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import RouteSeo from "../components/RouteSeo";
import ScrollToTop from "../components/ScrollToTop";

const MainLayout = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <RouteSeo />
      <ScrollToTop />
      <Header />

      <main className="flex-1 bg-slate-100 dark:bg-slate-950">
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
};

export default MainLayout;