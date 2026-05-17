import json
import re
from pathlib import Path


def load_projects() -> list[dict]:
    return json.loads(Path("PROJECTS.json").read_text(encoding="utf-8"))


def generate_table(projects: list[dict]) -> str:
    lines = [
        "| Projet | Ce que ça fait concrètement | Stack |",
        "| :-- | :-- | :-- |",
    ]
    for p in projects:
        name = p["name"]
        url = p.get("url")
        wip = " (WIP)" if p.get("wip") else ""
        label = f"**[{name}]({url})**{wip}" if url else f"**{name}**{wip}"
        lines.append(f"| {label} | {p['description']} | {p['stack']} |")
    return "\n".join(lines)


def update_readme(table: str) -> bool:
    path = Path("README.md")
    original = path.read_text(encoding="utf-8")
    updated = re.sub(
        r"<!-- PROJECTS:START -->.*?<!-- PROJECTS:END -->",
        f"<!-- PROJECTS:START -->\n{table}\n<!-- PROJECTS:END -->",
        original,
        flags=re.DOTALL,
    )
    if updated == original:
        print("No changes.")
        return False
    path.write_text(updated, encoding="utf-8")
    print("README.md updated.")
    return True


if __name__ == "__main__":
    projects = load_projects()
    table = generate_table(projects)
    update_readme(table)
