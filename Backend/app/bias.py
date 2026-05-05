import json
import math
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

DATA_FILE = Path(__file__).resolve().parents[1] / "data" / "data.json"


def parse_cards(s) -> tuple[int, int]:
    if not s:
        return 0, 0
    s = str(s).replace("–", "-")
    try:
        parts = s.split("-")
        if len(parts) == 2:
            return int(parts[0]), int(parts[1])
    except ValueError:
        pass
    return 0, 0


@dataclass
class BiasResult:
    referee: str
    matches: int
    composite_score: float
    card_rate_score: float
    home_away_score: float
    team_favoritism_score: float
    cards_per_game: float
    home_away_delta: float
    flagged_teams: list[str] = field(default_factory=list)


def _clamp_z(z: float) -> float:
    return min(10.0, max(0.0, z * 2.0 + 5.0))


def load_matches(seasons: Optional[list[int]] = None) -> list[dict]:
    with open(DATA_FILE, encoding="utf-8") as f:
        raw = json.load(f)
    matches = raw if isinstance(raw, list) else raw.get("matches", [])
    if seasons:
        matches = [m for m in matches if m.get("season") in seasons]
    return matches


def compute_bias_scores(
    matches: list[dict], min_matches: int = 10
) -> dict[str, "BiasResult"]:
    by_ref: dict[str, list[dict]] = {}
    for m in matches:
        ref = (m.get("referee") or "").strip()
        if ref:
            by_ref.setdefault(ref, []).append(m)

    by_ref = {k: v for k, v in by_ref.items() if len(v) >= min_matches}
    if not by_ref:
        return {}

    # Per-referee aggregates
    ref_cpg: dict[str, float] = {}
    ref_delta: dict[str, float] = {}
    for ref, ms in by_ref.items():
        total_cards = total_delta = 0
        for m in ms:
            yh, ya = parse_cards(m.get("yellow"))
            rh, ra = parse_cards(m.get("red"))
            total_cards += yh + ya + rh + ra
            total_delta += (yh + rh) - (ya + ra)
        ref_cpg[ref] = total_cards / len(ms)
        ref_delta[ref] = total_delta / len(ms)

    # League stats for signal 1 (card rate)
    cpg_vals = list(ref_cpg.values())
    mean_cpg = sum(cpg_vals) / len(cpg_vals)
    std_cpg = math.sqrt(sum((v - mean_cpg) ** 2 for v in cpg_vals) / len(cpg_vals)) or 1.0

    # League stats for signal 2 (home/away delta)
    delta_vals = list(ref_delta.values())
    mean_delta = sum(delta_vals) / len(delta_vals)
    std_delta = math.sqrt(sum((v - mean_delta) ** 2 for v in delta_vals) / len(delta_vals)) or 1.0

    # League-wide per-team card distributions (for signal 3)
    league_team: dict[str, list[float]] = {}
    for ref, ms in by_ref.items():
        for m in ms:
            yh, ya = parse_cards(m.get("yellow"))
            rh, ra = parse_cards(m.get("red"))
            home, away = m.get("home", ""), m.get("away", "")
            if home:
                league_team.setdefault(home, []).append(float(yh + rh))
            if away:
                league_team.setdefault(away, []).append(float(ya + ra))

    team_mean: dict[str, float] = {}
    team_std: dict[str, float] = {}
    for team, vals in league_team.items():
        m_ = sum(vals) / len(vals)
        team_mean[team] = m_
        team_std[team] = math.sqrt(sum((v - m_) ** 2 for v in vals) / len(vals)) or 1.0

    results: dict[str, BiasResult] = {}
    for ref, ms in by_ref.items():
        s1 = _clamp_z((ref_cpg[ref] - mean_cpg) / std_cpg)
        s2 = _clamp_z((ref_delta[ref] - mean_delta) / std_delta)

        # Signal 3: team favoritism
        ref_team: dict[str, list[float]] = {}
        for m in ms:
            yh, ya = parse_cards(m.get("yellow"))
            rh, ra = parse_cards(m.get("red"))
            home, away = m.get("home", ""), m.get("away", "")
            if home:
                ref_team.setdefault(home, []).append(float(yh + rh))
            if away:
                ref_team.setdefault(away, []).append(float(ya + ra))

        flagged = []
        for team, vals in ref_team.items():
            if len(vals) < 3:
                continue
            ref_avg = sum(vals) / len(vals)
            league_avg = team_mean.get(team, ref_avg)
            league_s = team_std.get(team, 1.0)
            if abs(ref_avg - league_avg) / league_s > 1.4:
                flagged.append(team)

        s3 = min(10.0, len(flagged) * 2.5)
        composite = round(s1 * 0.4 + s2 * 0.35 + s3 * 0.25, 1)

        results[ref] = BiasResult(
            referee=ref,
            matches=len(ms),
            composite_score=composite,
            card_rate_score=round(s1, 1),
            home_away_score=round(s2, 1),
            team_favoritism_score=round(s3, 1),
            cards_per_game=round(ref_cpg[ref], 2),
            home_away_delta=round(ref_delta[ref], 2),
            flagged_teams=sorted(flagged),
        )

    return results
