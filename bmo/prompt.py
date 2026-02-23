import json
from pathlib import Path


def load_prompt(path: Path) -> dict:
    try:
        raw = path.read_text(encoding="utf-8")
    except FileNotFoundError as exc:
        raise RuntimeError(f"Missing prompt JSON at: {path}") from exc

    try:
        prompt = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Invalid JSON in prompt file: {path} ({exc})") from exc

    if not isinstance(prompt, dict):
        raise RuntimeError(f"Prompt JSON must be an object at top-level: {path}")

    return prompt


def compose_instructions(prompt: dict) -> str:
    persona = prompt.get("persona") if isinstance(prompt.get("persona"), dict) else {}
    audio_control = (
        prompt.get("audio_control") if isinstance(prompt.get("audio_control"), dict) else {}
    )
    tools = prompt.get("tools") if isinstance(prompt.get("tools"), dict) else {}

    lines: list[str] = []

    role = prompt.get("role")
    if isinstance(role, str) and role.strip():
        lines.append(role.strip())

    for section_key, section_label in (
        ("tone", "Tone"),
        ("voice_style", "Voice"),
        ("lore", "Lore"),
    ):
        section = persona.get(section_key)
        if isinstance(section, list) and section:
            lines.append(f"{section_label}:")
            lines.extend(str(item).strip() for item in section if str(item).strip())

    phrases = persona.get("phrases")
    if isinstance(phrases, list) and phrases:
        joined = " ".join(str(p).strip() for p in phrases if str(p).strip())
        if joined:
            lines.append(f"Phrases (use sometimes): {joined}")

    constraints = prompt.get("constraints")
    if isinstance(constraints, list) and constraints:
        lines.append("Constraints:")
        lines.extend(str(item).strip() for item in constraints if str(item).strip())

    if audio_control:
        instruction = audio_control.get("instruction")
        format_rule = audio_control.get("format_rule")
        emotion_tags = audio_control.get("emotion_tags")
        audio_effects = audio_control.get("audio_effects")
        examples = audio_control.get("examples")

        lines.append("Emotion and audio control:")
        if isinstance(instruction, str) and instruction.strip():
            lines.append(instruction.strip())
        if isinstance(format_rule, str) and format_rule.strip():
            lines.append(format_rule.strip())

        if isinstance(emotion_tags, dict) and emotion_tags:
            lines.append("Available emotion tags:")
            for group, tags in emotion_tags.items():
                if isinstance(tags, list) and tags:
                    joined = " ".join(str(t).strip() for t in tags if str(t).strip())
                    if joined:
                        lines.append(f"{group}: {joined}")

        if isinstance(audio_effects, list) and audio_effects:
            joined = " ".join(str(e).strip() for e in audio_effects if str(e).strip())
            if joined:
                lines.append(f"Available audio effects: {joined}")

        if isinstance(examples, list) and examples:
            lines.append("Examples:")
            lines.extend(str(ex).strip() for ex in examples if str(ex).strip())

    tool_rules = tools.get("rules")
    if isinstance(tool_rules, list) and tool_rules:
        lines.append("Tools:")
        lines.append("You have access to tools.")
        lines.extend(str(item).strip() for item in tool_rules if str(item).strip())

    tool_descriptions = tools.get("descriptions")
    if isinstance(tool_descriptions, dict) and tool_descriptions:
        lines.append("Tool hints:")
        for tool_name, description in tool_descriptions.items():
            if str(tool_name).strip() and str(description).strip():
                lines.append(f"{str(tool_name).strip()}: {str(description).strip()}")

    return "\n".join(lines).strip()
