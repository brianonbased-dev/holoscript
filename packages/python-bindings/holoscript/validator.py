"""
HoloScript Validator - Validate HoloScript code with AI-friendly errors.
"""

from typing import List, Optional, Dict, Any
from dataclasses import dataclass, field
import re


@dataclass
class ValidationError:
    """A validation error with AI-friendly information."""
    code: str
    line: int
    column: int = 0
    message: str = ""
    context: str = ""
    suggestion: Optional[str] = None
    fix: Optional[Dict[str, Any]] = None


@dataclass
class ValidationResult:
    """Result of validating HoloScript code."""
    valid: bool
    errors: List[ValidationError] = field(default_factory=list)
    warnings: List[ValidationError] = field(default_factory=list)
    summary: str = ""


# Known traits for validation
KNOWN_TRAITS = {
    "grabbable", "throwable", "holdable", "clickable", "hoverable",
    "draggable", "pointable", "scalable", "collidable", "physics",
    "rigid", "kinematic", "trigger", "gravity", "glowing", "emissive",
    "transparent", "reflective", "animated", "billboard", "networked",
    "synced", "persistent", "owned", "host_only", "stackable",
    "attachable", "equippable", "consumable", "destructible", "anchor",
    "tracked", "world_locked", "hand_tracked", "eye_tracked",
    "spatial_audio", "ambient", "voice_activated", "state", "reactive",
    "observable", "computed", "shareable", "collaborative", "tweetable",
    # Digital Twin / Industrial
    "digital_twin", "twin_sync", "twin_actuator", "sensor",
    # Agent Mitosis
    "mitosis",
    # Web3 / Marketplace
    "nft", "token_gated", "wallet", "marketplace"
}

# Known geometry types
KNOWN_GEOMETRIES = {
    "cube", "sphere", "cylinder", "cone", "torus", "capsule", "plane",
    "box", "ring", "circle", "line"
}


def validate(
    code: str,
    include_warnings: bool = True,
    include_suggestions: bool = True
) -> ValidationResult:
    """
    Validate HoloScript code.
    
    Args:
        code: Source code to validate
        include_warnings: Include warnings in result
        include_suggestions: Include fix suggestions
    
    Returns:
        ValidationResult with errors and warnings
    """
    errors: List[ValidationError] = []
    warnings: List[ValidationError] = []
    lines = code.split("\n")
    
    # Check for empty code
    if not code.strip():
        errors.append(ValidationError(
            code="E001",
            line=1,
            message="Empty code",
            suggestion="Add HoloScript content"
        ))
        return ValidationResult(valid=False, errors=errors, summary="Empty code")
    
    # Check braces balance
    open_braces = code.count("{")
    close_braces = code.count("}")
    if open_braces != close_braces:
        errors.append(ValidationError(
            code="E002",
            line=1,
            message=f"Unbalanced braces: {open_braces} open, {close_braces} close",
            suggestion="Check for missing or extra { or }"
        ))
    
    # Check each line for issues
    for i, line in enumerate(lines, 1):
        # Check for unknown traits
        trait_matches = re.findall(r'@(\w+)', line)
        for trait in trait_matches:
            if trait.lower() not in KNOWN_TRAITS:
                similar = find_similar_trait(trait)
                error = ValidationError(
                    code="E003",
                    line=i,
                    column=line.find(f"@{trait}") + 1,
                    message=f"Unknown trait: @{trait}",
                    context=line.strip(),
                )
                if include_suggestions and similar:
                    error.suggestion = f"Did you mean @{similar}?"
                    error.fix = {
                        "type": "replace",
                        "old": f"@{trait}",
                        "new": f"@{similar}"
                    }
                errors.append(error)
        
        # Check for typos in geometry
        geo_match = re.search(r'geometry:\s*"([^"]+)"', line)
        if geo_match:
            geo = geo_match.group(1)
            # Check if it's a model path
            if not geo.startswith("model/") and geo.lower() not in KNOWN_GEOMETRIES:
                similar = find_similar_geometry(geo)
                error = ValidationError(
                    code="E004",
                    line=i,
                    message=f"Unknown geometry type: {geo}",
                    context=line.strip(),
                )
                if include_suggestions and similar:
                    error.suggestion = f"Did you mean '{similar}'?"
                    error.fix = {
                        "type": "replace",
                        "old": f'"{geo}"',
                        "new": f'"{similar}"'
                    }
                errors.append(error)
        
        # Check for common typos
        typos = [
            ("geomety:", "geometry:", "E005"),
            ("positon:", "position:", "E005"),
            ("rotatoin:", "rotation:", "E005"),
            ("collideable:", "collidable:", "E005"),
        ]
        for typo, correct, code in typos:
            if typo in line.lower():
                errors.append(ValidationError(
                    code=code,
                    line=i,
                    message=f"Typo: '{typo[:-1]}' should be '{correct[:-1]}'",
                    context=line.strip(),
                    suggestion=f"Use '{correct[:-1]}' instead",
                    fix={"type": "replace", "old": typo[:-1], "new": correct[:-1]}
                ))
        
        # Warnings
        if include_warnings:
            # Warn about objects without traits
            if re.match(r'\s*(orb|object)\s+\w+\s*{', line) and "@" not in line:
                warnings.append(ValidationError(
                    code="W001",
                    line=i,
                    message="Object has no VR traits",
                    context=line.strip(),
                    suggestion="Consider adding @pointable for basic interactivity"
                ))
    
    # Build summary
    if errors:
        summary = f"❌ Found {len(errors)} error(s)"
    elif warnings:
        summary = f"⚠️ Valid with {len(warnings)} warning(s)"
    else:
        summary = "✅ Valid HoloScript code"
    
    return ValidationResult(
        valid=len(errors) == 0,
        errors=errors,
        warnings=warnings if include_warnings else [],
        summary=summary
    )


def find_similar_trait(trait: str) -> Optional[str]:
    """Find a similar trait name for suggestions."""
    trait_lower = trait.lower()
    
    # Check for prefix matches
    for known in KNOWN_TRAITS:
        if known.startswith(trait_lower[:3]):
            return known
        if trait_lower in known or known in trait_lower:
            return known
    
    # Levenshtein-like matching
    best_match = None
    best_score = 0
    
    for known in KNOWN_TRAITS:
        # Simple character overlap scoring
        common = sum(1 for c in trait_lower if c in known)
        score = common / max(len(trait_lower), len(known))
        if score > best_score and score > 0.5:
            best_score = score
            best_match = known
    
    return best_match


def find_similar_geometry(geo: str) -> Optional[str]:
    """Find a similar geometry type for suggestions."""
    geo_lower = geo.lower()
    
    # Common typos
    typo_map = {
        "sper": "sphere",
        "spher": "sphere",
        "spere": "sphere",
        "cub": "cube",
        "cueb": "cube",
        "cylnder": "cylinder",
        "cylindr": "cylinder",
        "cylindr": "cylinder",
        "con": "cone",
        "coen": "cone",
        "plan": "plane",
        "plae": "plane",
        "torus": "torus",
    }
    
    if geo_lower in typo_map:
        return typo_map[geo_lower]
    
    # Check prefixes
    for known in KNOWN_GEOMETRIES:
        if known.startswith(geo_lower[:3]):
            return known
    
    return None
