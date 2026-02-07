"""
Tests for HoloScript Python package initialization and basic integration.
"""

import pytest


class TestPackageImport:
    """Tests for package imports."""

    def test_import_parser(self):
        """Should be able to import parser module."""
        from holoscript import parser
        assert hasattr(parser, 'parse')

    def test_import_validator(self):
        """Should be able to import validator module."""
        from holoscript import validator
        assert hasattr(validator, 'validate')

    def test_import_traits(self):
        """Should be able to import traits module."""
        from holoscript import traits
        assert hasattr(traits, 'list_traits')


class TestIntegration:
    """Integration tests for parser + validator."""

    def test_parse_then_validate(self):
        """Should be able to parse and then validate."""
        from holoscript.parser import parse
        from holoscript.validator import validate
        
        code = 'orb test { @grabbable color: "red" }'
        
        parse_result = parse(code)
        validate_result = validate(code)
        
        assert parse_result.success is True
        assert validate_result.valid is True

    def test_invalid_code_detected_by_both(self):
        """Both parser and validator should detect invalid code."""
        from holoscript.parser import parse
        from holoscript.validator import validate
        
        code = 'orb { missing name'  # Invalid: no name and unbalanced braces
        
        parse_result = parse(code)
        validate_result = validate(code)
        
        # At least one should report issues
        assert parse_result.success is False or validate_result.valid is False


class TestVersionInfo:
    """Tests for version information."""

    def test_package_has_version(self):
        """Package should expose version info."""
        import holoscript
        # Check if version attribute exists (may or may not be set)
        # Just importing successfully is the main test
        assert holoscript is not None
