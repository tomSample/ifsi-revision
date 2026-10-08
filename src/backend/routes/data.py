"""
Data API routes
"""
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree

from flask import Blueprint, jsonify
from config import PROJECT_ROOT
from utils.logger import setup_logger

logger = setup_logger(__name__)
bp = Blueprint('data', __name__, url_prefix='/api/data')

XLSX_PATH = PROJECT_ROOT / 'src' / 'data' / 'UE-2.8' / 'UE 2.8 - processus obstructifs.xlsx'
XLSX_NAMESPACE = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

@bp.route('/', methods=['GET'])
def get_data():
    """Get data"""
    try:
        # TODO: Implement data endpoint
        return jsonify({'data': []}), 200
    except Exception as e:
        logger.error(f"Error getting data: {e}")
        return {'error': 'Internal server error'}, 500


def _read_shared_strings(workbook):
    """Read the shared strings used by the worksheet cells."""
    try:
        root = ElementTree.fromstring(workbook.read('xl/sharedStrings.xml'))
    except KeyError:
        return []

    values = []
    for item in root.findall('main:si', XLSX_NAMESPACE):
        text = ''.join(node.text or '' for node in item.iter() if node.tag.endswith('}t'))
        values.append(text)
    return values


def _read_cell_value(cell, shared_strings):
    value = cell.find('main:v', XLSX_NAMESPACE)
    if value is None or value.text is None:
        inline = cell.find('main:is', XLSX_NAMESPACE)
        if inline is None:
            return ''
        return ''.join(node.text or '' for node in inline.iter() if node.tag.endswith('}t')).strip()

    result = value.text
    if cell.get('t') == 's':
        try:
            return shared_strings[int(result)].strip()
        except (IndexError, ValueError):
            return ''
    return result.strip()


def _column_number(reference):
    """Convert an Excel cell reference such as AA12 to a zero-based column."""
    letters = ''.join(character for character in reference if character.isalpha())
    number = 0
    for character in letters.upper():
        number = number * 26 + ord(character) - ord('A') + 1
    return number - 1


def _load_td_questions():
    """Convert the UE 2.8 workbook into questionnaires grouped by pathology."""
    if not XLSX_PATH.is_file():
        raise FileNotFoundError(f'Workbook not found: {XLSX_PATH}')

    with ZipFile(XLSX_PATH) as workbook:
        shared_strings = _read_shared_strings(workbook)
        sheet = ElementTree.fromstring(workbook.read('xl/worksheets/sheet1.xml'))
        rows = []
        for row in sheet.findall('.//main:row', XLSX_NAMESPACE):
            values = {}
            for cell in row.findall('main:c', XLSX_NAMESPACE):
                values[_column_number(cell.get('r', ''))] = _read_cell_value(cell, shared_strings)
            rows.append(values)

    if not rows:
        return []

    headers = rows[0]
    questionnaires = []
    for column, title in headers.items():
        if column == 0 or not title:
            continue
        questions = []
        for row in rows[1:]:
            category = row.get(0, '')
            answer = row.get(column, '')
            if category and answer:
                questions.append({
                    'id': len(questions) + 1,
                    'question': f'{category} pour la pathologie « {title} » ?',
                    'reponse': answer,
                    'categorie': category,
                })
        if questions:
            questionnaires.append({
                'titre': title,
                'description': f'{len(questions)} questions de type TD',
                'questions': questions,
            })
    return questionnaires


@bp.route('/td-questions', methods=['GET'])
def get_td_questions():
    """Return the UE 2.8 questionnaires generated from the Excel workbook."""
    try:
        return jsonify({
            'ue': 'UE 2.8',
            'questionnaires': _load_td_questions(),
        })
    except (FileNotFoundError, KeyError, ElementTree.ParseError) as error:
        logger.error(f"Unable to parse TD questions workbook: {error}")
        return jsonify({'error': 'Le tableau des questions TD est indisponible.'}), 500
