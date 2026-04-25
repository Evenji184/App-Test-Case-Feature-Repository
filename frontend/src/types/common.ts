export interface ErrorInfo {
  code: string;
  message: string;
}

export interface PageInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationInput {
  page?: number;
  pageSize?: number;
}

export interface MutationResult {
  success: boolean;
  message: string;
  error?: ErrorInfo | null;
}

export interface ListResult<T> {
  items: T[];
  pageInfo: PageInfo;
}

export interface OptionItem {
  label: string;
  value: string;
}
