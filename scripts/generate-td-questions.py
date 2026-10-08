#!/usr/bin/env python3
"""Generate the static TD questionnaires from the UE 2.8 workbook."""

import json
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree


PROJECT_ROOT = Path(__file__).resolve().parent.parent
WORKBOOK_PATH = PROJECT_ROOT / "src" / "data" / "UE-2.8" / "UE 2.8 - processus obstructifs.xlsx"
OUTPUT_PATH = PROJECT_ROOT / "src" / "data" / "UE-2.8" / "td-questions.json"
NAMESPACE = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def read_shared_strings(workbook):
    try:
        root = ElementTree.fromstring(workbook.read("xl/sharedStrings.xml"))
    except KeyError:
        return []

    return [
        "".join(node.text or "" for node in item.iter() if node.tag.endswith("}t"))
        for item in root.findall("main:si", NAMESPACE)
    ]


def read_cell_value(cell, shared_strings):
    value = cell.find("main:v", NAMESPACE)
    if value is None or value.text is None:
        inline = cell.find("main:is", NAMESPACE)
        if inline is None:
            return ""
        return "".join(
            node.text or "" for node in inline.iter() if node.tag.endswith("}t")
        ).strip()

    result = value.text
    if cell.get("t") == "s":
        try:
            return shared_strings[int(result)].strip()
        except (IndexError, ValueError):
            return ""
    return result.strip()


def column_number(reference):
    letters = "".join(character for character in reference if character.isalpha())
    number = 0
    for character in letters.upper():
        number = number * 26 + ord(character) - ord("A") + 1
    return number - 1


def load_rows():
    if not WORKBOOK_PATH.is_file():
        raise FileNotFoundError(f"Workbook not found: {WORKBOOK_PATH}")

    with zipfile.ZipFile(WORKBOOK_PATH) as workbook:
        shared_strings = read_shared_strings(workbook)
        sheet = ElementTree.fromstring(workbook.read("xl/worksheets/sheet1.xml"))
        rows = []
        for row in sheet.findall(".//main:row", NAMESPACE):
            values = {}
            for cell in row.findall("main:c", NAMESPACE):
                values[column_number(cell.get("r", ""))] = read_cell_value(
                    cell, shared_strings
                )
            rows.append(values)
    return rows


def build_data():
    rows = load_rows()
    if not rows:
        return {"ue": "UE 2.8", "questionnaires": []}

    questionnaires = []
    for column, title in rows[0].items():
        if column == 0 or not title:
            continue

        questions = []
        for row in rows[1:]:
            category = row.get(0, "")
            answer = row.get(column, "")
            if category and answer:
                questions.append(
                    {
                        "id": len(questions) + 1,
                        "question": f"{category} pour la pathologie « {title} » ?",
                        "reponse": answer,
                        "categorie": category,
                    }
                )

        if questions:
            questionnaires.append(
                {
                    "titre": title,
                    "description": f"{len(questions)} questions de type TD",
                    "questions": questions,
                }
            )

    return {"ue": "UE 2.8", "questionnaires": questionnaires}


def main():
    try:
        data = build_data()
        OUTPUT_PATH.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
    except (FileNotFoundError, KeyError, ElementTree.ParseError, zipfile.BadZipFile) as error:
        print(f"Unable to generate TD questions: {error}", file=sys.stderr)
        return 1

    question_count = sum(len(item["questions"]) for item in data["questionnaires"])
    print(
        f"Generated {OUTPUT_PATH} "
        f"({len(data['questionnaires'])} questionnaires, {question_count} questions)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
