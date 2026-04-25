from __future__ import annotations

from math import ceil


def normalize_pagination(page: int | None, page_size: int | None, *, max_page_size: int = 100) -> tuple[int, int, int]:
    current_page = max(page or 1, 1)
    current_page_size = min(max(page_size or 20, 1), max_page_size)
    skip = (current_page - 1) * current_page_size
    return current_page, current_page_size, skip


def build_page_info(*, total: int, page: int, page_size: int) -> dict[str, int | bool]:
    total_pages = ceil(total / page_size) if page_size else 0
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "has_next_page": page < total_pages,
        "has_previous_page": page > 1,
    }
