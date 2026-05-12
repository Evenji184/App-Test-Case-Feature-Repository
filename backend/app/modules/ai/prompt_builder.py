from __future__ import annotations

from typing import Any


SYSTEM_PROMPT = """你是一名资深的软件测试工程师，擅长根据产品特征描述提炼测试要点。

你的输出要求：
1. 针对每个特征，列出关键测试维度和需要测试的方向（功能要点、边界条件、异常路径、权限控制、并发等）
2. 仅描述"要测什么"，不展开为具体的测试步骤和预期结果
3. 按优先级标注测试要点（高/中/低）
4. 如果特征描述中有平台信息，标注平台差异点
5. 使用 Markdown 格式输出，结构清晰，精炼简洁"""


def build_generate_prompt(
    *,
    nodes: list[dict[str, Any]],
    features: list[dict[str, Any]],
    custom_instruction: str | None = None,
) -> tuple[str, str]:
    node_map: dict[str, dict[str, Any]] = {n["id"]: n for n in nodes}

    sections: list[str] = []

    # Node hierarchy context
    node_lines: list[str] = []
    for node in nodes:
        node_lines.append(
            f"  - [{node['node_type']}] {node['name']} (路径: {node['path']})"
        )
    if node_lines:
        sections.append("## 特征节点结构\n" + "\n".join(node_lines))

    # Feature details
    feature_lines: list[str] = []
    for feat in features:
        parent_node = node_map.get(feat.get("node_id", ""))
        parent_path = parent_node["path"] if parent_node else "未知"
        lines = [
            f"### {feat['title']}",
            f"- 编码: {feat['code']}",
            f"- 所属节点路径: {parent_path}",
        ]
        if feat.get("summary"):
            lines.append(f"- 摘要: {feat['summary']}")
        if feat.get("description"):
            lines.append(f"- 详细描述: {feat['description']}")
        if feat.get("platform"):
            lines.append(f"- 目标平台: {feat['platform']}")
        if feat.get("priority"):
            lines.append(f"- 优先级: {feat['priority']}")
        if feat.get("tags"):
            lines.append(f"- 标签: {feat['tags']}")
        if feat.get("status"):
            lines.append(f"- 状态: {feat['status']}")
        feature_lines.append("\n".join(lines))

    if feature_lines:
        sections.append("## 特征详情\n" + "\n\n".join(feature_lines))

    # Custom instruction
    if custom_instruction:
        sections.append(f"## 补充要求\n{custom_instruction}")

    user_prompt = (
        f"请根据以下 {len(features)} 个特征的描述，输出测试要点提示词。\n\n"
        + "\n\n".join(sections)
        + "\n\n仅描述需要测试的维度和方向，不要展开为具体步骤和预期结果。"
    )

    return SYSTEM_PROMPT, user_prompt