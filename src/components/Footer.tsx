const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-4 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} MarianTools
        </p>
      </div>
    </footer>
  )
}

export default Footer
