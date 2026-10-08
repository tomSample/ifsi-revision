#!/usr/bin/env python3
"""Generate the UE 2.6 recap data from the three structured workbook sheets."""

import json
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree


PROJECT_ROOT = Path(__file__).resolve().parent.parent
WORKBOOK_PATH = PROJECT_ROOT / "src" / "data" / "UE-2.6" / "UE 2.6 - processus psychopathologiques.xlsx"
OUTPUT_PATH = PROJECT_ROOT / "src" / "data" / "UE-2.6" / "psychopathologie.normalized.json"
NAMESPACE = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
RELATIONSHIP_NAMESPACE = {
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships"
}
WORKBOOK_RELATIONSHIP_NAMESPACE = {
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
}


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


def read_sheet(workbook, sheet_name, shared_strings):
    sheet = ElementTree.fromstring(workbook.read(sheet_name))
    rows = []
    for row in sheet.findall(".//main:row", NAMESPACE):
        values = {}
        for cell in row.findall("main:c", NAMESPACE):
            values[column_number(cell.get("r", ""))] = read_cell_value(
                cell, shared_strings
            )
        rows.append(values)
    if not rows:
        return []

    headers = rows[0]
    return [
        {headers[column]: value for column, value in row.items() if column in headers}
        for row in rows[1:]
        if any(value for value in row.values())
    ]


def find_named_sheets(workbook):
    workbook_root = ElementTree.fromstring(workbook.read("xl/workbook.xml"))
    relationships_root = ElementTree.fromstring(
        workbook.read("xl/_rels/workbook.xml.rels")
    )
    relationships = {
        relationship.get("Id"): relationship.get("Target")
        for relationship in relationships_root.findall(
            "rel:Relationship", RELATIONSHIP_NAMESPACE
        )
    }
    sheets = {}
    for sheet in workbook_root.findall("main:sheets/main:sheet", NAMESPACE):
        if sheet.get("name") in {"Categories", "Formes cliniques", "Traitements"}:
            relationship_id = sheet.get(
                f"{{{WORKBOOK_RELATIONSHIP_NAMESPACE['r']}}}id"
            )
            target = relationships.get(relationship_id)
            if target:
                target = target.lstrip("/")
                sheets[sheet.get("name")] = (
                    target if target.startswith("xl/") else f"xl/{target}"
                )
    missing = {"Categories", "Formes cliniques", "Traitements"} - sheets.keys()
    if missing:
        raise KeyError(f"Missing workbook sheets: {', '.join(sorted(missing))}")
    return sheets


def split_lines(value):
    return [line.strip(" -•\t") for line in value.splitlines() if line.strip(" -•\t")]


def build_data():
    if not WORKBOOK_PATH.is_file():
        raise FileNotFoundError(f"Workbook not found: {WORKBOOK_PATH}")

    with zipfile.ZipFile(WORKBOOK_PATH) as workbook:
        shared_strings = read_shared_strings(workbook)
        sheets = find_named_sheets(workbook)
        categories = read_sheet(workbook, sheets["Categories"], shared_strings)
        forms = read_sheet(workbook, sheets["Formes cliniques"], shared_strings)
        treatments = read_sheet(workbook, sheets["Traitements"], shared_strings)

    categories_by_id = {
        row.get("id_categorie", "").strip(): row
        for row in categories
        if row.get("id_categorie", "").strip()
    }
    treatments_by_id = {
        row.get("id_forme", "").strip(): row
        for row in treatments
        if row.get("id_forme", "").strip()
    }

    records = []
    for row in forms:
        form_id = row.get("id_forme", "").strip()
        category_id = row.get("id_categorie", "").strip()
        category = categories_by_id.get(category_id)
        if not form_id or not category:
            continue
        treatment = treatments_by_id.get(form_id, {})
        record = {
            "id": form_id,
            "idCategorie": category_id,
            "categorie": category.get("Catégorie", ""),
            "definitionCategorie": category.get("Définition", ""),
            "motsClesCategorie": split_lines(category.get("Mots clés", "")),
            "sousCategorie": row.get("Sous-catégorie", ""),
            "formeClinique": row.get("Forme clinique", ""),
            "definitionForme": row.get("Définition", ""),
            "criteresDiagnostic": split_lines(row.get("Critères diagnostic", "")),
            "semiologie": split_lines(row.get("Sémiologie", "")),
            "facteursRisque": split_lines(row.get("Facteurs de risque", "")),
            "evolutionComplication": split_lines(
                row.get("Evolution / Complication", "")
            ),
            "traitements": split_lines(treatment.get("Traitements", "")),
        }
        records.append(record)

    return records


def main():
    try:
        data = build_data()
        OUTPUT_PATH.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
    except (FileNotFoundError, KeyError, ElementTree.ParseError, zipfile.BadZipFile) as error:
        print(f"Unable to generate UE 2.6 data: {error}", file=sys.stderr)
        return 1

    print(f"Generated {OUTPUT_PATH} ({len(data)} clinical forms)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
