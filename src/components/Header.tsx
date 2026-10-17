import { Link } from "react-router-dom";
import AccountLink from "./AccountLink";
import ThemeToggle from "./ThemeToggle";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          MarianTools
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <AccountLink />
        </div>
      </nav>
    </header>
  );
};

export default Header;
