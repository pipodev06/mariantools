import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          MarianTools
        </Link>
        <Link
          to="/tools"
          className="text-sm text-slate-500 transition-colors hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
        >
          Herramientas
        </Link>
      </nav>
    </header>
  );
};

export default Header;
