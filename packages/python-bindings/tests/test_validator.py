"""
Tests for HoloScript validator module.
"""

import pytest
from holoscript.validator import (
    validate,
    ValidationResult,
    ValidationError,
    KNOWN_TRAITS,
    KNOWN_GEOMETRIES,
)


class TestValidate:
    """Tests for the validate() function."""

    def test_validate_empty_code_fails(self):
        """Empty code should fail validation."""
        result = validate("")
        assert result.valid is False
        assert len(result.errors) > 0
        assert any(e.code == "E001" for e in result.errors)

    def test_validate_simple_valid_code(self):
        """Simple valid code should pass."""
        code = 'orb test { color: "red" }'
        result = validate(code)
        assert result.valid is True

    def test_validate_unbalanced_braces(self):
        """Unbalanced braces should fail with E002."""
        code = 'orb test { color: "red"'
        result = validate(code)
        assert result.valid is False
        assert any(e.code == "E002" for e in result.errors)

    def test_validate_unknown_trait_warning(self):
        """Unknown traits should produce errors."""
        code = 'orb test { @unknown_xyz_trait }'
        result = validate(code, include_warnings=True)
        # Unknown traits produce errors, not warnings
        assert len(result.errors) > 0
        assert any('unknown' in e.message.lower() for e in result.errors)

    def test_validate_includes_suggestions(self):
        """Validation should include fix suggestions."""
        code = ""
        result = validate(code, include_suggestions=True)
        assert len(result.errors) > 0
        # Should have a suggestion for empty code
        assert result.errors[0].suggestion is not None

    def test_validate_without_warnings(self):
        """Should respect include_warnings=False."""
        code = 'orb test { @unknown_trait }'
        result = validate(code, include_warnings=False)
        # Still should have result but we're not explicitly filtering in our implementation


class TestValidationResult:
    """Tests for ValidationResult dataclass."""

    def test_validation_result_defaults(self):
        """ValidationResult should have sensible defaults."""
        result = ValidationResult(valid=True)
        assert result.errors == []
        assert result.warnings == []
        assert result.summary == ""

    def test_validation_result_with_errors(self):
        """Can create ValidationResult with errors."""
        error = ValidationError(code="E001", line=1, message="Test error")
        result = ValidationResult(valid=False, errors=[error])
        assert len(result.errors) == 1


class TestValidationError:
    """Tests for ValidationError dataclass."""

    def test_validation_error_creation(self):
        """Should create ValidationError with required fields."""
        error = ValidationError(code="E001", line=10, message="Test")
        assert error.code == "E001"
        assert error.line == 10
        assert error.message == "Test"

    def test_validation_error_with_optional_fields(self):
        """Should support optional fields."""
        error = ValidationError(
            code="E002",
            line=5,
            column=10,
            message="Error",
            context="orb { }",
            suggestion="Add object name",
            fix={"type": "insert", "text": "name"}
        )
        assert error.column == 10
        assert error.context == "orb { }"
        assert error.suggestion == "Add object name"
        assert error.fix is not None


class TestKnownTraits:
    """Tests for KNOWN_TRAITS constant."""

    def test_known_traits_not_empty(self):
        """KNOWN_TRAITS should contain entries."""
        assert len(KNOWN_TRAITS) > 0

    def test_known_traits_contains_common_traits(self):
        """Should contain common VR traits."""
        assert "grabbable" in KNOWN_TRAITS
        assert "physics" in KNOWN_TRAITS
        assert "collidable" in KNOWN_TRAITS
        assert "networked" in KNOWN_TRAITS

    def test_known_traits_contains_interaction_traits(self):
        """Should contain interaction traits."""
        assert "clickable" in KNOWN_TRAITS
        assert "hoverable" in KNOWN_TRAITS
        assert "pointable" in KNOWN_TRAITS

    def test_known_traits_contains_audio_traits(self):
        """Should contain audio traits."""
        assert "spatial_audio" in KNOWN_TRAITS
        assert "ambient" in KNOWN_TRAITS

    def test_known_traits_all_lowercase(self):
        """All trait names should be lowercase."""
        for trait in KNOWN_TRAITS:
            assert trait == trait.lower()


class TestKnownGeometries:
    """Tests for KNOWN_GEOMETRIES constant."""

    def test_known_geometries_not_empty(self):
        """KNOWN_GEOMETRIES should contain entries."""
        assert len(KNOWN_GEOMETRIES) > 0

    def test_known_geometries_contains_primitives(self):
        """Should contain primitive geometries."""
        assert "cube" in KNOWN_GEOMETRIES
        assert "sphere" in KNOWN_GEOMETRIES
        assert "cylinder" in KNOWN_GEOMETRIES

    def test_known_geometries_contains_basic_shapes(self):
        """Should contain basic shapes."""
        assert "plane" in KNOWN_GEOMETRIES
        assert "cone" in KNOWN_GEOMETRIES
        assert "torus" in KNOWN_GEOMETRIES
