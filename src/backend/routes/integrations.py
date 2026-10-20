"""Routes for the isolated learning-resource area."""
from urllib.parse import quote
from urllib.request import Request, urlopen
import json
from typing import Any, Dict

from flask import Blueprint, jsonify, request

from integrations.cache import integration_cache
from utils.logger import setup_logger

logger = setup_logger(__name__)
bp = Blueprint("integrations", __name__, url_prefix="/api/integrations")
def _error_response(message: str, status: int = 502):
    return jsonify({"error": message, "source": "integration"}), status


def _get_json(url: str, timeout: int = 8) -> Any:
    request_obj = Request(url, headers={"Accept": "application/json", "User-Agent": "IFSI-Revision/3.0"})
    with urlopen(request_obj, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


@bp.route("/search")
def search_resources():
    query = request.args.get("q", "").strip()
    if len(query) < 2:
        return jsonify({"results": [], "query": query})
    try:
        results = [
            {
                "type": "medication",
                "title": f"Médicaments correspondant à « {query} »",
                "subtitle": "OpenFDA",
                "url": f"./medications.html?q={quote(query)}",
            },
            {
                "type": "reference",
                "title": f"Articles scientifiques sur « {query} »",
                "subtitle": "Europe PMC",
                "url": f"./references.html?q={quote(query)}",
            },
            {
                "type": "study",
                "title": f"Études cliniques sur « {query} »",
                "subtitle": "ClinicalTrials.gov",
                "url": f"./clinical-cases.html?q={quote(query)}",
            },
            {
                "type": "concept",
                "title": f"Concepts MeSH liés à « {query} »",
                "subtitle": "NCBI MeSH",
                "url": f"./ressources.html?q={quote(query)}",
            },
            {
                "type": "public-health",
                "title": f"Indicateurs OMS liés à « {query} »",
                "subtitle": "WHO GHO",
                "url": f"./public-health.html?q={quote(query)}",
            },
        ]
        return jsonify({"results": results, "query": query, "source": "external"})
    except (OSError, ValueError, KeyError) as error:
        logger.error("External resource search failed: %s", error)
        return _error_response("La recherche externe est indisponible.", 502)


@bp.route("/medications")
def medications():
    query = request.args.get("q", "").strip().lower()
    if len(query) < 2:
        return jsonify({"medications": [], "query": query, "source": "OpenFDA"})
    try:
        payload = integration_cache.get_or_set(
            f"openfda-medications:{query}",
            lambda: _get_json(
                "https://api.fda.gov/drug/label.json"
                f"?search=openfda.generic_name:%22{quote(query)}%22"
                f"+OR+openfda.brand_name:%22{quote(query)}%22&limit=20"
            ),
            ttl=3600,
        )
        result = []
        for item in payload.get("results", []):
            openfda = item.get("openfda", {})
            generic_names = openfda.get("generic_name", [])
            brand_names = openfda.get("brand_name", [])
            name = generic_names[0] if generic_names else (brand_names[0] if brand_names else query)
            result.append({
                "name": name,
                "brandNames": brand_names[:8],
                "activeIngredients": generic_names[:8],
                "indications": item.get("indications", [])[:3],
                "warnings": item.get("warnings", [])[:3],
                "adverseReactions": item.get("adverse_reactions", [])[:3],
                "dosageAndAdministration": item.get("dosage_and_administration", [])[:2],
                "sourceUrl": "https://api.fda.gov/drug/label.json",
                "officialSource": "OpenFDA drug labeling",
            })
        return jsonify({"medications": result, "query": query, "source": "OpenFDA"})
    except (OSError, ValueError, KeyError, TimeoutError) as error:
        logger.warning("OpenFDA unavailable for %r: %s", query, error)
        return _error_response("La recherche de médicaments externe est indisponible.")


@bp.route("/references")
def references():
    query = request.args.get("q", "").strip()
    if len(query) < 2:
        return jsonify({"articles": [], "query": query})
    cache_key = f"europe-pmc:{query.lower()}"
    try:
        payload: Dict[str, Any] = integration_cache.get_or_set(
            cache_key,
            lambda: _get_json(
                "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
                f"?query={quote(query)}&format=json&pageSize=8&resultType=core"
            ),
            ttl=3600,
        )
        articles = []
        for item in payload.get("resultList", {}).get("result", []):
            articles.append({
                "title": item.get("title", "Article sans titre"),
                "year": item.get("pubYear", ""),
                "journal": item.get("journalTitle", ""),
                "abstract": item.get("abstractText", ""),
                "url": f"https://europepmc.org/article/{item.get('source', 'MED')}/{item.get('id', '')}",
            })
        return jsonify({"articles": articles, "query": query, "source": "Europe PMC"})
    except (OSError, ValueError, KeyError, TimeoutError) as error:
        logger.warning("Europe PMC unavailable for %r: %s", query, error)
        return _error_response("Les références scientifiques sont temporairement indisponibles.")


@bp.route("/health")
def integration_health():
    return jsonify({"status": "ok", "integrations": ["local", "medications", "references", "clinical-cases", "public-health", "mesh"]})


@bp.route("/clinical-cases")
def clinical_cases():
    query = request.args.get("q", "").strip()
    if len(query) < 2:
        return jsonify({"studies": [], "query": query, "source": "ClinicalTrials.gov"})
    try:
        payload = integration_cache.get_or_set(
            f"clinicaltrials:{query.lower()}",
            lambda: _get_json(
                "https://clinicaltrials.gov/api/v2/studies"
                f"?query.term={quote(query)}&pageSize=20&format=json"
            ),
            ttl=1800,
        )
        studies = []
        for study in payload.get("studies", []):
            protocol = study.get("protocolSection", {})
            identification = protocol.get("identificationModule", {})
            status = protocol.get("statusModule", {})
            design = protocol.get("designModule", {})
            studies.append({
                "id": identification.get("nctId", ""),
                "title": identification.get("briefTitle", "Étude sans titre"),
                "summary": protocol.get("descriptionModule", {}).get("briefSummary", ""),
                "status": status.get("overallStatus", ""),
                "studyType": design.get("studyType", ""),
                "phases": design.get("phases", []),
                "url": f"https://clinicaltrials.gov/study/{identification.get('nctId', '')}",
            })
        return jsonify({"studies": studies, "query": query, "source": "ClinicalTrials.gov"})
    except (OSError, ValueError, KeyError, TimeoutError) as error:
        logger.warning("ClinicalTrials.gov unavailable for %r: %s", query, error)
        return _error_response("La recherche d'études cliniques externe est indisponible.")


@bp.route("/public-health")
def public_health():
    query = request.args.get("q", "").strip() or "diabetes"
    try:
        payload = integration_cache.get_or_set(
            f"who-indicators:{query.lower()}",
            lambda: _get_json(
                "https://ghoapi.azureedge.net/api/Indicator"
                f"?$filter=contains(IndicatorName,%27{quote(query)}%27)&$top=30"
            ),
            ttl=3600,
        )
        indicators = [
            {
                "code": item.get("IndicatorCode", ""),
                "title": item.get("IndicatorName", ""),
                "language": item.get("Language", ""),
                "sourceUrl": f"https://www.who.int/data/gho/data/indicators",
            }
            for item in payload.get("value", [])
        ]
        return jsonify({
            "indicators": indicators,
            "query": query,
            "source": "WHO Global Health Observatory API",
        })
    except (OSError, ValueError, KeyError, TimeoutError) as error:
        logger.warning("WHO GHO unavailable for %r: %s", query, error)
        return _error_response("Les indicateurs de santé publique externes sont indisponibles.")


@bp.route("/mesh")
def mesh_search():
    query = request.args.get("q", "").strip().lower()
    if len(query) < 2:
        return jsonify({"concepts": [], "query": query})
    try:
        concepts = integration_cache.get_or_set(
            f"mesh:{query}",
            lambda: _get_mesh_results(query),
            ttl=3600,
        )
        return jsonify({"concepts": concepts, "query": query, "source": "NCBI MeSH"})
    except (OSError, ValueError, KeyError, TimeoutError) as error:
        logger.warning("NCBI MeSH unavailable for %r: %s", query, error)
        return _error_response("La recherche de concepts MeSH externe est indisponible.")


def _get_mesh_results(query: str):
    search_payload = _get_json(
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
        f"?db=mesh&term={quote(query)}&retmode=json&retmax=20"
    )
    identifiers = search_payload.get("esearchresult", {}).get("idlist", [])
    if not identifiers:
        return []
    summary = _get_json(
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
        f"?db=mesh&id={','.join(identifiers)}&retmode=json"
    )
    result = summary.get("result", {})
    return [
        {
            "id": identifier,
            "term": result.get(identifier, {}).get("ds_meshterms", ["Concept MeSH"])[0],
            "url": f"https://www.ncbi.nlm.nih.gov/mesh/{identifier}",
        }
        for identifier in identifiers
    ]
