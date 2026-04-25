import { useState } from 'react';

export function usePagination(initialPage = 1, initialPageSize = 20) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  return {
    page,
    pageSize,
    pagination: { page, pageSize },
    setPage,
    setPageSize,
    reset: () => {
      setPage(initialPage);
      setPageSize(initialPageSize);
    },
  };
}
