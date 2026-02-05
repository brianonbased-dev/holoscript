"""
HoloScript Generator - Generate HoloScript from natural language.
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
import re


@dataclass
class GenerateResult:
    """Result of generating HoloScript code."""
    code: str
    format: str
    traits: List[str] = field(default_factory=list)
    objects: int = 0
    stats: Dict[str, int] = field(default_factory=dict)


# Trait suggestions based on keywords
TRAIT_KEYWORDS: Dict[str, List[str]] = {
    # Interaction
    "pick up": ["@grabbable"],
    "grab": ["@grabbable"],
    "hold": ["@grabbable", "@holdable"],
    "throw": ["@grabbable", "@throwable"],
    "click": ["@clickable"],
    "point": ["@pointable"],
    "hover": ["@hoverable"],
    "drag": ["@draggable"],
    "scale": ["@scalable"],
    "resize": ["@scalable"],
    
    # Physics
    "collide": ["@collidable"],
    "bounce": ["@collidable", "@physics"],
    "physics": ["@physics", "@collidable"],
    "fall": ["@physics", "@gravity"],
    "gravity": ["@gravity"],
    "trigger": ["@trigger"],
    
    # Visual
    "glow": ["@glowing"],
    "light": ["@emissive"],
    "transparent": ["@transparent"],
    "see through": ["@transparent"],
    "reflect": ["@reflective"],
    "mirror": ["@reflective"],
    "animate": ["@animated"],
    "spin": ["@animated"],
    "rotate": ["@animated"],
    "billboard": ["@billboard"],
    "face camera": ["@billboard"],
    
    # Networking
    "multiplayer": ["@networked", "@synced"],
    "sync": ["@networked", "@synced"],
    "network": ["@networked"],
    "save": ["@persistent"],
    "persist": ["@persistent"],
    
    # Behavior
    "stack": ["@stackable"],
    "attach": ["@attachable"],
    "equip": ["@equippable"],
    "wear": ["@equippable"],
    "consume": ["@consumable"],
    "eat": ["@consumable"],
    "destroy": ["@destructible"],
    "break": ["@destructible"],
    
    # Spatial
    "anchor": ["@anchor"],
    "track": ["@tracked"],
    "hand track": ["@hand_tracked"],
    "eye track": ["@eye_tracked"],
    
    # Audio
    "sound": ["@spatial_audio"],
    "audio": ["@spatial_audio"],
    "ambient": ["@ambient"],
    "voice": ["@voice_activated"],
    
    # Social (new)
    "share": ["@shareable"],
    "collaborate": ["@collaborative"],
    "tweet": ["@tweetable"],
}

# Geometry keywords
GEOMETRY_KEYWORDS: Dict[str, str] = {
    "cube": "cube",
    "box": "cube",
    "sphere": "sphere",
    "ball": "sphere",
    "orb": "sphere",
    "cylinder": "cylinder",
    "tube": "cylinder",
    "pipe": "cylinder",
    "cone": "cone",
    "pyramid": "cone",
    "torus": "torus",
    "ring": "torus",
    "donut": "torus",
    "capsule": "capsule",
    "pill": "capsule",
    "plane": "plane",
    "floor": "plane",
    "ground": "plane",
    "wall": "plane",
    "crystal": "model/crystal.glb",
    "sword": "model/sword.glb",
    "tree": "model/tree.glb",
    "rock": "model/rock.glb",
}

# Color keywords
COLOR_KEYWORDS: Dict[str, str] = {
    "red": "#ff0000",
    "green": "#00ff00",
    "blue": "#0000ff",
    "cyan": "#00ffff",
    "magenta": "#ff00ff",
    "yellow": "#ffff00",
    "orange": "#ff8800",
    "purple": "#8800ff",
    "pink": "#ff88ff",
    "white": "#ffffff",
    "black": "#000000",
    "gray": "#888888",
    "grey": "#888888",
    "gold": "#ffd700",
    "silver": "#c0c0c0",
}


def generate_object(
    description: str,
    format: str = "hsplus",
    include_docs: bool = False
) -> GenerateResult:
    """
    Generate a single object from natural language.
    
    Args:
        description: Natural language description
        format: Output format - "hs", "hsplus", or "holo"
        include_docs: Include documentation comments
    
    Returns:
        GenerateResult with object code
    """
    lower_desc = description.lower()
    
    # Extract geometry
    geometry = "sphere"
    for keyword, geo in GEOMETRY_KEYWORDS.items():
        if keyword in lower_desc:
            geometry = geo
            break
    
    # Extract color
    color = "#00ffff"
    for keyword, hex_color in COLOR_KEYWORDS.items():
        if keyword in lower_desc:
            color = hex_color
            break
    
    # Extract traits
    traits = suggest_traits_from_description(description)
    
    # Extract object name
    words = description.split()
    name_word = next((w for w in words if w[0].isupper()), words[-1] if words else "Object")
    object_name = re.sub(r'[^a-zA-Z0-9]', '', name_word)
    
    # Generate code
    if format == "holo":
        code = generate_holo_object(object_name, geometry, color, traits, include_docs)
    elif format == "hsplus":
        code = generate_hsplus_object(object_name, geometry, color, traits, include_docs)
    else:
        code = generate_hs_object(object_name, geometry, color, traits, include_docs)
    
    return GenerateResult(
        code=code,
        format=format,
        traits=traits,
        objects=1,
        stats={"lines": len(code.split("\n")), "characters": len(code)}
    )


def generate_scene(
    description: str,
    format: str = "holo",
    style: str = "detailed",
    features: Optional[List[str]] = None
) -> GenerateResult:
    """
    Generate a complete scene from natural language.
    
    Args:
        description: Natural language description
        format: Output format
        style: "minimal", "detailed", or "production"
        features: Features to include
    
    Returns:
        GenerateResult with scene code
    """
    features = features or []
    lower_desc = description.lower()
    
    # Parse scene elements
    scene_name = extract_scene_name(description)
    objects = extract_objects(description)
    environment = generate_environment(description, style)
    
    # Generate object code
    object_code_list = []
    all_traits: List[str] = []
    
    for obj in objects:
        result = generate_object(obj["description"], format="holo", include_docs=style != "minimal")
        object_code_list.append(result.code)
        all_traits.extend(result.traits)
    
    # Build composition
    objects_section = "\n\n".join(f"    {code.replace(chr(10), chr(10) + '    ')}" for code in object_code_list)
    
    logic_section = ""
    if "logic" in features or style == "production":
        logic_section = """
  logic {
    on_scene_start() {
      console.log("Scene loaded!")
    }
  }"""
    
    code = f'''composition "{scene_name}" {{
{environment}

  spatial_group "Main" {{
{objects_section}
  }}{logic_section}
}}'''
    
    return GenerateResult(
        code=code,
        format=format,
        traits=list(set(all_traits)),
        objects=len(objects),
        stats={
            "lines": len(code.split("\n")),
            "characters": len(code),
        }
    )


def suggest_traits_from_description(description: str) -> List[str]:
    """Extract traits based on description keywords."""
    lower_desc = description.lower()
    traits: List[str] = []
    
    for keyword, trait_list in TRAIT_KEYWORDS.items():
        if keyword in lower_desc:
            for trait in trait_list:
                if trait not in traits:
                    traits.append(trait)
    
    # Default trait if none found
    if not traits:
        traits.append("@pointable")
    
    return traits


def generate_holo_object(name: str, geometry: str, color: str, traits: List[str], docs: bool) -> str:
    """Generate a .holo object definition."""
    traits_str = "\n".join(f"    {t}" for t in traits)
    doc_comment = f'  // {name} - Generated from natural language\n' if docs else ""
    
    return f'''{doc_comment}object "{name}" {{
{traits_str}
    geometry: "{geometry}"
    color: "{color}"
    position: [0, 1, 0]
  }}'''


def generate_hsplus_object(name: str, geometry: str, color: str, traits: List[str], docs: bool) -> str:
    """Generate a .hsplus object definition."""
    traits_str = " ".join(traits)
    doc_comment = f"// {name} - Generated from natural language\n" if docs else ""
    
    return f'''{doc_comment}orb {name} {traits_str} {{
  geometry: "{geometry}"
  color: "{color}"
  position: [0, 1, 0]
}}'''


def generate_hs_object(name: str, geometry: str, color: str, traits: List[str], docs: bool) -> str:
    """Generate a .hs object definition."""
    doc_comment = f"// {name} - Generated from natural language\n" if docs else ""
    
    return f'''{doc_comment}orb {name} {{
  geometry: "{geometry}"
  color: "{color}"
  position: {{ x: 0, y: 1, z: 0 }}
}}'''


def extract_scene_name(description: str) -> str:
    """Extract scene name from description."""
    match = re.search(r'(?:a|an|the)?\s*([a-z]+(?:\s+[a-z]+)?)\s*(?:scene|world|room|space)', description, re.IGNORECASE)
    if match:
        return match.group(1).title()
    
    # Use first few significant words
    words = [w for w in description.split()[:3] if len(w) > 2]
    return " ".join(words).title() if words else "Generated Scene"


def extract_objects(description: str) -> List[Dict[str, str]]:
    """Extract object descriptions from scene description."""
    objects: List[Dict[str, str]] = []
    
    # Look for "with X, Y, and Z" pattern
    match = re.search(r'(?:with|containing|featuring|has|include)\s+([^.]+)', description, re.IGNORECASE)
    if match:
        items = re.split(r',\s*and\s*|,\s*|\s+and\s+', match.group(1))
        for item in items:
            item = item.strip()
            if item:
                # Extract name from the item
                words = item.split()
                name = words[-1].title() if words else "Object"
                objects.append({"name": name, "description": item})
    
    # Default object if none found
    if not objects:
        objects.append({"name": "MainObject", "description": description})
    
    return objects


def generate_environment(description: str, style: str) -> str:
    """Generate environment block from description."""
    lower_desc = description.lower()
    
    # Determine skybox
    skybox = "gradient"
    if "forest" in lower_desc or "nature" in lower_desc:
        skybox = "forest"
    elif any(s in lower_desc for s in ["space", "galaxy", "nebula", "stars"]):
        skybox = "nebula"
    elif "sunset" in lower_desc or "sunrise" in lower_desc:
        skybox = "sunset"
    elif "night" in lower_desc or "moon" in lower_desc:
        skybox = "night"
    elif "ocean" in lower_desc or "beach" in lower_desc:
        skybox = "ocean"
    elif "cave" in lower_desc or "dark" in lower_desc:
        skybox = "dark"
    
    # Determine lighting
    ambient_light = 0.3
    if "dark" in lower_desc or "night" in lower_desc or "cave" in lower_desc:
        ambient_light = 0.1
    elif "bright" in lower_desc or "sunny" in lower_desc:
        ambient_light = 0.7
    
    if style == "minimal":
        return f'''  environment {{
    skybox: "{skybox}"
  }}'''
    
    return f'''  environment {{
    skybox: "{skybox}"
    ambient_light: {ambient_light}
    fog: {{ enabled: true, density: 0.01 }}
  }}'''


def generate(
    description: str,
    format: str = "holo",
    include_docs: bool = False
) -> GenerateResult:
    """
    Generate HoloScript code from a natural language description.
    
    This is a convenience function that calls generate_scene for full scenes
    or generate_object for single objects.
    
    Args:
        description: Natural language description of what to create
        format: Output format - 'holo', 'hsplus', or 'hs'
        include_docs: Whether to include documentation comments
        
    Returns:
        GenerateResult with generated code
        
    Example:
        >>> result = generate("a glowing sphere that spins")
        >>> print(result.code)
    """
    # Simple heuristic: if it mentions multiple objects or scene/world, use scene
    lower = description.lower()
    is_scene = any(word in lower for word in ["scene", "world", "environment", "room", "forest", "space", " and ", "with"])
    
    if is_scene:
        return generate_scene(description, style="detailed", format=format)
    else:
        return generate_object(description, format=format, include_docs=include_docs)
