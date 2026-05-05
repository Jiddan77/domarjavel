from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from .bias import load_matches, compute_bias_scores, parse_cards

router = APIRouter()


def _find_referee(name: str, bias_results: dict) -> Optional[object]:
    direct = bias_results.get(name)
    if direct:
        return direct
    name_upper = name.upper()
    for key, val in bias_results.items():
        if key.upper() == name_upper:
            return val
    return None


@router.get("/bias")
def get_bias_scores(
    season: Optional[list[int]] = Query(default=None),
    minMatches: int = Query(default=10, ge=1),
):
    matches = load_matches(seasons=season or None)
    if season:
        matches = [m for m in matches if m.get("season") in season]
    results = compute_bias_scores(matches, min_matches=minMatches)
    return [
        {
            "referee": r.referee,
            "matches": r.matches,
            "composite_score": r.composite_score,
            "card_rate_score": r.card_rate_score,
            "home_away_score": r.home_away_score,
            "team_favoritism_score": r.team_favoritism_score,
            "cards_per_game": r.cards_per_game,
            "home_away_delta": r.home_away_delta,
            "flagged_teams": r.flagged_teams,
        }
        for r in sorted(results.values(), key=lambda x: x.composite_score, reverse=True)
    ]


@router.get("/compare")
def get_compare(
    referee: list[str] = Query(...),
    season: Optional[list[int]] = Query(default=None),
):
    if len(referee) < 2:
        raise HTTPException(status_code=422, detail="Provide at least 2 referee names")
    if len(referee) > 4:
        raise HTTPException(status_code=422, detail="Maximum 4 referee names allowed")

    matches = load_matches(seasons=season or None)
    bias_results = compute_bias_scores(matches, min_matches=1)

    output = []
    not_found = []
    for req in referee:
        found = _find_referee(req, bias_results)
        if not found:
            not_found.append(req)
            continue

        ref_matches = [
            m for m in matches
            if (m.get("referee") or "").upper() == found.referee.upper()
        ]
        total_pen = sum(
            sum(parse_cards(m.get("penalty", "")))
            for m in ref_matches
        )
        penalties_per_game = round(total_pen / len(ref_matches), 2) if ref_matches else 0.0

        output.append({
            "name": found.referee,
            "matches": found.matches,
            "cards_per_game": found.cards_per_game,
            "penalties_per_game": penalties_per_game,
            "home_card_advantage": found.home_away_delta,
            "bias": {
                "composite_score": found.composite_score,
                "card_rate_score": found.card_rate_score,
                "home_away_score": found.home_away_score,
                "team_favoritism_score": found.team_favoritism_score,
                "flagged_teams": found.flagged_teams,
            },
        })

    if not_found:
        raise HTTPException(
            status_code=404,
            detail=f"Referees not found: {', '.join(not_found)}"
        )

    all_cpg = [r.cards_per_game for r in bias_results.values()]
    all_delta = [r.home_away_delta for r in bias_results.values()]
    total_pen = sum(
        sum(parse_cards(m.get("penalty", "")))
        for m in matches if (m.get("referee") or "").strip()
    )
    total_pen_matches = sum(1 for m in matches if (m.get("referee") or "").strip())

    league_avg = {
        "cards_per_game": round(sum(all_cpg) / len(all_cpg), 2) if all_cpg else 0.0,
        "penalties_per_game": round(total_pen / total_pen_matches, 2) if total_pen_matches else 0.0,
        "home_card_advantage": round(sum(all_delta) / len(all_delta), 2) if all_delta else 0.0,
    }

    return {"referees": output, "league_avg": league_avg}
