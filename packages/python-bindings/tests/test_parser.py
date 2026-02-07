"""
Tests for HoloScript parser module.
"""

import pytest
from holoscript.parser import (
    parse,
    parse_holo,
    parse_hsplus,
    ParseResult,
    ParseError,
    extract_environment,
    extract_templates,
    extract_logic,
)


class TestParse:
    """Tests for the main parse() function."""

    def test_parse_empty_code(self):
        """Empty code should parse with empty results."""
        result = parse("")
        assert isinstance(result, ParseResult)

    def test_parse_auto_detects_holo(self):
        """Should auto-detect .holo format when 'composition' is present."""
        code = 'composition "Test" { object "Cube" {} }'
        result = parse(code)
        assert result.format == "holo"

    def test_parse_auto_detects_hsplus(self):
        """Should auto-detect .hsplus format when traits are present."""
        code = 'orb test { @grabbable color: "red" }'
        result = parse(code)
        assert result.format == "hsplus"

    def test_parse_auto_detects_hs(self):
        """Should detect .hs format when no traits are present."""
        code = 'orb test { color: "red" }'
        result = parse(code)
        assert result.format == "hs"

    def test_parse_with_explicit_format(self):
        """Should respect explicit format parameter."""
        code = 'orb test { }'
        result = parse(code, format="holo")
        assert result.format == "holo"


class TestParseHolo:
    """Tests for parse_holo() function."""

    def test_parse_simple_composition(self):
        """Should parse a simple composition."""
        code = '''
        composition "MyScene" {
            environment {
                skybox: "nebula"
            }
        }
        '''
        result = parse_holo(code)
        assert result.success is True
        assert result.ast["name"] == "MyScene"

    def test_parse_extracts_objects(self):
        """Should extract object names."""
        code = '''
        composition "Test" {
            object "Player" { }
            object "Enemy" { }
        }
        '''
        result = parse_holo(code)
        assert "Player" in result.objects
        assert "Enemy" in result.objects

    def test_parse_extracts_traits(self):
        """Should extract trait names."""
        code = '''
        composition "Test" {
            object "Cube" {
                @grabbable
                @physics
            }
        }
        '''
        result = parse_holo(code)
        assert "grabbable" in result.traits
        assert "physics" in result.traits

    def test_parse_unbalanced_braces_fails(self):
        """Unbalanced braces should cause parse failure."""
        code = 'composition "Test" { object "Cube" { }'
        result = parse_holo(code)
        assert result.success is False
        assert len(result.errors) > 0
        assert "brace" in result.errors[0].message.lower()


class TestParseHsplus:
    """Tests for parse_hsplus() function."""

    def test_parse_simple_orb(self):
        """Should parse a simple orb definition."""
        code = 'orb test { color: "blue" }'
        result = parse_hsplus(code)
        assert result.success is True
        assert "test" in result.objects

    def test_parse_multiple_objects(self):
        """Should parse multiple object definitions."""
        code = '''
        orb player { }
        cube block { }
        sphere ball { }
        '''
        result = parse_hsplus(code)
        assert "player" in result.objects
        assert "block" in result.objects
        assert "ball" in result.objects

    def test_parse_detects_traits(self):
        """Should detect traits from code."""
        code = '''
        orb test {
            @grabbable
            @collidable
            @networked
        }
        '''
        result = parse_hsplus(code)
        assert "grabbable" in result.traits
        assert "collidable" in result.traits
        assert "networked" in result.traits

    def test_parse_warns_on_unknown_trait(self):
        """Should warn on unknown traits."""
        code = 'orb test { @unknown_trait_xyz }'
        result = parse_hsplus(code)
        assert len(result.warnings) > 0
        assert any("unknown" in w.message.lower() for w in result.warnings)


class TestExtractEnvironment:
    """Tests for extract_environment() function."""

    def test_extract_skybox(self):
        """Should extract skybox setting."""
        code = '''
        environment {
            skybox: "space"
        }
        '''
        env = extract_environment(code)
        assert env.get("skybox") == "space"

    def test_extract_ambient_light(self):
        """Should extract ambient_light as float."""
        code = '''
        environment {
            ambient_light: 0.5
        }
        '''
        env = extract_environment(code)
        assert env.get("ambient_light") == 0.5

    def test_extract_empty_environment(self):
        """Should return empty dict when no environment block."""
        code = 'composition "Test" { }'
        env = extract_environment(code)
        assert env == {}


class TestExtractTemplates:
    """Tests for extract_templates() function."""

    def test_extract_single_template(self):
        """Should extract a single template."""
        code = '''
        template "Player" {
            geometry: "humanoid"
            color: "#00ff00"
        }
        '''
        templates = extract_templates(code)
        assert len(templates) == 1
        assert templates[0]["name"] == "Player"

    def test_extract_multiple_templates(self):
        """Should extract multiple templates."""
        code = '''
        template "Enemy" { health: 100 }
        template "Ally" { health: 200 }
        '''
        templates = extract_templates(code)
        assert len(templates) == 2
        names = [t["name"] for t in templates]
        assert "Enemy" in names
        assert "Ally" in names

    def test_extract_no_templates(self):
        """Should return empty list when no templates."""
        code = 'orb test { }'
        templates = extract_templates(code)
        assert templates == []


class TestExtractLogic:
    """Tests for extract_logic() function."""

    def test_extract_logic_block(self):
        """Should extract logic block content."""
        code = '''
        logic {
            on_start: { console.log("started") }
        }
        '''
        logic = extract_logic(code)
        assert "content" in logic
        assert "on_start" in logic["content"]

    def test_extract_no_logic(self):
        """Should return empty dict when no logic block."""
        code = 'orb test { }'
        logic = extract_logic(code)
        assert logic == {}


class TestParseResult:
    """Tests for ParseResult dataclass."""

    def test_parse_result_defaults(self):
        """ParseResult should have sensible defaults."""
        result = ParseResult(success=True)
        assert result.ast is None
        assert result.errors == []
        assert result.warnings == []
        assert result.format == "unknown"
        assert result.objects == []
        assert result.traits == []


class TestParseError:
    """Tests for ParseError dataclass."""

    def test_parse_error_creation(self):
        """Should create ParseError with required fields."""
        error = ParseError(message="Syntax error", line=10)
        assert error.message == "Syntax error"
        assert error.line == 10
        assert error.column == 0
        assert error.severity == "error"

    def test_parse_error_with_column(self):
        """Should create ParseError with column."""
        error = ParseError(message="Error", line=5, column=20)
        assert error.column == 20
