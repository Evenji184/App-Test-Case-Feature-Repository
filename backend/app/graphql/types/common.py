from __future__ import annotations

from typing import Optional

import strawberry


@strawberry.type
class ErrorType:
    code: str
    message: str


@strawberry.type
class PageInfo:
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next_page: bool
    has_previous_page: bool


@strawberry.input
class PaginationInput:
    page: int = 1
    page_size: int = 20


@strawberry.type
class MutationResult:
    success: bool
    message: str
    error: Optional[ErrorType] = None
