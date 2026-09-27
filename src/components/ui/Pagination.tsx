interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, Math.min(page - 2, totalPages - 4)),
    Math.max(4, page + 2),
  );

  return (
    <div className="flex items-center justify-end gap-1.5 pt-5 text-sm">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="flex items-center gap-1 px-2 py-1 font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-brand)] disabled:pointer-events-none disabled:opacity-40"
      >
        &lsaquo; Previous
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`flex h-8 w-8 items-center justify-center rounded-full font-medium transition-colors ${
            p === page
              ? "bg-[var(--color-brand)] text-white"
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="flex items-center gap-1 px-2 py-1 font-medium text-[var(--color-brand)] transition-colors disabled:pointer-events-none disabled:opacity-40"
      >
        Next &rsaquo;
      </button>
    </div>
  );
}
