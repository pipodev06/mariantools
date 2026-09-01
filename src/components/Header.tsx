import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <nav className="mx-auto flex max-w-5xl items-center px-6 py-4">
        <Link to="/" className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          MarianTools
        </Link>
      </nav>
    </header>
  );
};

export default Header;
