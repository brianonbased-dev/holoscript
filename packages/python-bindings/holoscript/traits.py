"""
HoloScript Traits - VR trait documentation and suggestions.
"""

from typing import Dict, List, Optional, Any


# All 49+ VR traits organized by category
TRAITS: Dict[str, List[str]] = {
    "interaction": [
        "@grabbable",
        "@throwable",
        "@holdable",
        "@clickable",
        "@hoverable",
        "@draggable",
        "@pointable",
        "@scalable",
    ],
    "physics": [
        "@collidable",
        "@physics",
        "@rigid",
        "@kinematic",
        "@trigger",
        "@gravity",
    ],
    "visual": [
        "@glowing",
        "@emissive",
        "@transparent",
        "@reflective",
        "@animated",
        "@billboard",
    ],
    "networking": [
        "@networked",
        "@synced",
        "@persistent",
        "@owned",
        "@host_only",
    ],
    "behavior": [
        "@stackable",
        "@attachable",
        "@equippable",
        "@consumable",
        "@destructible",
    ],
    "spatial": [
        "@anchor",
        "@tracked",
        "@world_locked",
        "@hand_tracked",
        "@eye_tracked",
    ],
    "audio": [
        "@spatial_audio",
        "@ambient",
        "@voice_activated",
    ],
    "state": [
        "@state",
        "@reactive",
        "@observable",
        "@computed",
    ],
    "social": [
        "@shareable",
        "@collaborative",
        "@tweetable",
    ],
}

# Trait documentation
TRAIT_DOCS: Dict[str, Dict[str, Any]] = {
    "@grabbable": {
        "name": "@grabbable",
        "category": "interaction",
        "description": "Allows the object to be picked up by the user in VR/AR.",
        "parameters": [
            {"name": "snap_to_hand", "type": "boolean", "default": "false"},
            {"name": "two_handed", "type": "boolean", "default": "false"},
            {"name": "highlight", "type": "boolean", "default": "true"},
        ],
        "events": ["onGrab", "onRelease"],
        "example": '''orb Sword @grabbable(snap_to_hand: true) {
  geometry: "model/sword.glb"
  onGrab: { haptic.feedback('medium') }
}''',
        "related": ["@throwable", "@holdable", "@equippable"],
    },
    "@glowing": {
        "name": "@glowing",
        "category": "visual",
        "description": "Object emits a glow effect.",
        "parameters": [
            {"name": "intensity", "type": "number", "default": "0.5"},
            {"name": "color", "type": "string", "default": "inherit"},
            {"name": "pulse", "type": "boolean", "default": "false"},
        ],
        "events": [],
        "example": '''orb Crystal @glowing(intensity: 0.8, pulse: true) {
  geometry: "sphere"
  color: "#00ffff"
}''',
        "related": ["@emissive"],
    },
    "@networked": {
        "name": "@networked",
        "category": "networking",
        "description": "Object state is synchronized across clients.",
        "parameters": [
            {"name": "sync_rate", "type": "string", "default": "20hz"},
            {"name": "interpolate", "type": "boolean", "default": "true"},
        ],
        "events": ["onNetworkSync", "onOwnershipChange"],
        "example": '''orb Ball @networked(sync_rate: "30hz") @grabbable {
  geometry: "sphere"
  @networked position
  @networked rotation
}''',
        "related": ["@synced", "@persistent", "@owned"],
    },
    "@shareable": {
        "name": "@shareable",
        "category": "social",
        "description": "Auto-generates X-optimized previews for sharing.",
        "parameters": [
            {"name": "camera", "type": "array", "default": "[5, 2, 5]"},
            {"name": "animation", "type": "string", "default": "rotate"},
            {"name": "duration", "type": "string", "default": "3s"},
        ],
        "events": ["onShare"],
        "example": '''object Sculpture @shareable {
  geometry: "model/sculpture.glb"
  preview: {
    camera: [5, 2, 5]
    animation: "rotate"
  }
}''',
        "related": ["@tweetable", "@collaborative"],
    },
    "@collaborative": {
        "name": "@collaborative",
        "category": "social",
        "description": "Real-time multi-user editing via WebRTC.",
        "parameters": [
            {"name": "sync", "type": "string", "default": "realtime"},
            {"name": "maxUsers", "type": "number", "default": "10"},
            {"name": "permissions", "type": "array", "default": '["edit", "view"]'},
        ],
        "events": ["onUserJoin", "onUserLeave", "onEdit"],
        "example": '''spatial_group "Workspace" @collaborative {
  sync: "realtime"
  maxUsers: 10
}''',
        "related": ["@networked", "@shareable"],
    },
    "@tweetable": {
        "name": "@tweetable",
        "category": "social",
        "description": "Generates tweet with preview when shared.",
        "parameters": [
            {"name": "template", "type": "string", "default": '"Check out {name}!"'},
            {"name": "hashtags", "type": "array", "default": '["HoloScript", "VR"]'},
        ],
        "events": ["onTweet"],
        "example": '''object Art @tweetable {
  template: "Check out my creation: {name}! #HoloScript #VR"
}''',
        "related": ["@shareable"],
    },
}


def list_traits(category: Optional[str] = None) -> Dict[str, List[str]]:
    """
    List available VR traits.
    
    Args:
        category: Optional category filter
    
    Returns:
        Dictionary of traits by category
    """
    if category and category != "all":
        if category not in TRAITS:
            return {"error": f"Unknown category: {category}", "valid_categories": list(TRAITS.keys())}
        return {category: TRAITS[category]}
    
    return TRAITS


def explain_trait(trait: str) -> Dict[str, Any]:
    """
    Get detailed documentation for a trait.
    
    Args:
        trait: Trait name (with or without @)
    
    Returns:
        Trait documentation
    """
    # Normalize trait name
    if not trait.startswith("@"):
        trait = "@" + trait
    
    if trait in TRAIT_DOCS:
        return TRAIT_DOCS[trait]
    
    # Find similar traits
    similar = find_similar_traits(trait)
    return {
        "error": f"Unknown trait: {trait}",
        "suggestion": f"Did you mean: {', '.join(similar)}?" if similar else None,
        "all_traits": [t for traits in TRAITS.values() for t in traits],
    }


def suggest_traits(description: str, context: Optional[str] = None) -> Dict[str, Any]:
    """
    Suggest traits based on description.
    
    Args:
        description: Object description
        context: Additional context
    
    Returns:
        Suggested traits with reasoning
    """
    lower_desc = (description + " " + (context or "")).lower()
    suggested: List[str] = []
    reasoning: Dict[str, str] = {}
    
    # Keyword-based suggestions
    keyword_map = {
        "grab": "@grabbable",
        "pick up": "@grabbable",
        "throw": "@throwable",
        "glow": "@glowing",
        "light": "@emissive",
        "physics": "@physics",
        "collide": "@collidable",
        "click": "@clickable",
        "multiplayer": "@networked",
        "sync": "@synced",
        "share": "@shareable",
        "tweet": "@tweetable",
        "collaborate": "@collaborative",
    }
    
    for keyword, trait in keyword_map.items():
        if keyword in lower_desc:
            if trait not in suggested:
                suggested.append(trait)
                reasoning[trait] = f'Suggested because description mentions "{keyword}"'
    
    # Default trait
    if not suggested:
        suggested.append("@pointable")
        reasoning["@pointable"] = "Default trait for interactive objects"
    
    confidence = min(0.95, 0.5 + len(suggested) * 0.1)
    
    return {
        "traits": suggested,
        "reasoning": reasoning,
        "confidence": confidence,
    }


def find_similar_traits(trait: str) -> List[str]:
    """Find similar trait names."""
    normalized = trait.replace("@", "").lower()
    all_traits = [t for traits in TRAITS.values() for t in traits]
    
    similar = []
    for t in all_traits:
        t_name = t.replace("@", "").lower()
        if t_name.startswith(normalized[:3]) or normalized in t_name:
            similar.append(t)
    
    return similar[:3]
