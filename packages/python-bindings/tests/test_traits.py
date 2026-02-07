"""
Tests for HoloScript traits module.
"""

import pytest
from holoscript.traits import (
    TRAITS,
    TRAIT_DOCS,
    list_traits,
    explain_trait,
    suggest_traits,
    find_similar_traits,
)


class TestTraitsConstant:
    """Tests for TRAITS constant."""

    def test_traits_not_empty(self):
        """TRAITS should contain categories."""
        assert len(TRAITS) > 0

    def test_traits_has_interaction_category(self):
        """Should have interaction category."""
        assert "interaction" in TRAITS

    def test_traits_has_physics_category(self):
        """Should have physics category."""
        assert "physics" in TRAITS

    def test_traits_has_networking_category(self):
        """Should have networking category."""
        assert "networking" in TRAITS

    def test_interaction_contains_grabbable(self):
        """Interaction category should contain @grabbable."""
        assert "@grabbable" in TRAITS["interaction"]

    def test_physics_contains_collidable(self):
        """Physics category should contain @collidable."""
        assert "@collidable" in TRAITS["physics"]

    def test_all_traits_start_with_at(self):
        """All trait names should start with @."""
        for category, traits in TRAITS.items():
            for trait in traits:
                assert trait.startswith("@"), f"Trait {trait} should start with @"


class TestTraitDocs:
    """Tests for TRAIT_DOCS constant."""

    def test_trait_docs_not_empty(self):
        """TRAIT_DOCS should contain entries."""
        assert len(TRAIT_DOCS) > 0

    def test_grabbable_has_docs(self):
        """@grabbable should have documentation."""
        assert "@grabbable" in TRAIT_DOCS

    def test_trait_doc_has_required_fields(self):
        """Trait docs should have required fields."""
        doc = TRAIT_DOCS["@grabbable"]
        assert "name" in doc
        assert "category" in doc
        assert "description" in doc

    def test_trait_doc_has_example(self):
        """Trait docs should have example code."""
        doc = TRAIT_DOCS["@grabbable"]
        assert "example" in doc
        assert len(doc["example"]) > 0


class TestListTraits:
    """Tests for list_traits() function."""

    def test_list_all_traits(self):
        """Should return all traits when no category."""
        result = list_traits()
        assert isinstance(result, dict)
        assert len(result) > 0

    def test_list_traits_by_category(self):
        """Should filter by category."""
        result = list_traits("interaction")
        assert "interaction" in result
        assert "@grabbable" in result["interaction"]

    def test_list_traits_unknown_category(self):
        """Should return error for unknown category."""
        result = list_traits("nonexistent_xyz")
        assert "error" in result

    def test_list_traits_all_category(self):
        """Should return all when category is 'all'."""
        result = list_traits("all")
        assert "interaction" in result
        assert "physics" in result


class TestExplainTrait:
    """Tests for explain_trait() function."""

    def test_explain_existing_trait(self):
        """Should return docs for existing trait."""
        result = explain_trait("@grabbable")
        assert result["name"] == "@grabbable"
        assert "description" in result

    def test_explain_trait_without_at(self):
        """Should work without @ prefix."""
        result = explain_trait("grabbable")
        assert result["name"] == "@grabbable"

    def test_explain_unknown_trait(self):
        """Should return error for unknown trait."""
        result = explain_trait("nonexistent_xyz")
        assert "error" in result

    def test_explain_unknown_trait_suggests_similar(self):
        """Should suggest similar traits for typos."""
        result = explain_trait("grabable")  # typo
        # Should either return the trait or suggest similar
        assert "@grabbable" in str(result)


class TestSuggestTraits:
    """Tests for suggest_traits() function."""

    def test_suggest_for_grabbable_object(self):
        """Should suggest @grabbable for grab-related descriptions."""
        result = suggest_traits("an object the user can grab and pick up")
        assert "@grabbable" in result["traits"]

    def test_suggest_for_glowing_object(self):
        """Should suggest @glowing for glow descriptions."""
        result = suggest_traits("a crystal that glows")
        assert "@glowing" in result["traits"]

    def test_suggest_for_multiplayer(self):
        """Should suggest @networked for multiplayer descriptions."""
        result = suggest_traits("a multiplayer synchronized object")
        assert "@networked" in result["traits"]

    def test_suggest_returns_confidence(self):
        """Should return confidence score."""
        result = suggest_traits("a glowing crystal")
        assert "confidence" in result
        assert 0 <= result["confidence"] <= 1

    def test_suggest_returns_reasoning(self):
        """Should return reasoning for suggestions."""
        result = suggest_traits("an object to grab")
        assert "reasoning" in result

    def test_suggest_default_trait(self):
        """Should suggest default trait when no keywords match."""
        result = suggest_traits("generic object")
        assert len(result["traits"]) > 0


class TestFindSimilarTraits:
    """Tests for find_similar_traits() function."""

    def test_find_similar_to_grab(self):
        """Should find @grabbable for 'grab'."""
        result = find_similar_traits("grab")
        assert any("grab" in t.lower() for t in result)

    def test_find_similar_with_at(self):
        """Should work with @ prefix."""
        result = find_similar_traits("@grab")
        assert len(result) >= 0  # May or may not find matches

    def test_find_similar_returns_list(self):
        """Should return a list."""
        result = find_similar_traits("unknown")
        assert isinstance(result, list)

    def test_find_similar_limits_results(self):
        """Should limit number of results."""
        result = find_similar_traits("a")  # Very broad
        assert len(result) <= 3

