from __future__ import annotations

from collections import defaultdict
from typing import Any


def build_tree(items: list[dict[str, Any]], *, id_key: str = "id", parent_key: str = "parent_id", children_key: str = "children") -> list[dict[str, Any]]:
    grouped: dict[str | None, list[dict[str, Any]]] = defaultdict(list)
    indexed: dict[str, dict[str, Any]] = {}

    for item in items:
        node = dict(item)
        node[children_key] = []
        indexed[node[id_key]] = node
        grouped[node.get(parent_key)].append(node)

    for node in indexed.values():
        node[children_key] = grouped.get(node[id_key], [])

    return grouped.get(None, [])
