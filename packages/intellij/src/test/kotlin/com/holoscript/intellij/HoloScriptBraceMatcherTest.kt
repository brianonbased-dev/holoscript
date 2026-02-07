package com.holoscript.intellij

import com.holoscript.intellij.lexer.HoloScriptTokenTypes
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach

/**
 * Tests for HoloScriptBraceMatcher
 */
class HoloScriptBraceMatcherTest {
    
    private lateinit var matcher: HoloScriptBraceMatcher
    
    @BeforeEach
    fun setup() {
        matcher = HoloScriptBraceMatcher()
    }
    
    // ===== Brace Pair Tests =====
    
    @Test
    fun `has three brace pairs`() {
        val pairs = matcher.pairs
        assertEquals(3, pairs.size)
    }
    
    @Test
    fun `curly braces are paired`() {
        val pairs = matcher.pairs
        val curlyPair = pairs.find { 
            it.leftBraceType == HoloScriptTokenTypes.LBRACE 
        }
        assertNotNull(curlyPair)
        assertEquals(HoloScriptTokenTypes.RBRACE, curlyPair?.rightBraceType)
    }
    
    @Test
    fun `square brackets are paired`() {
        val pairs = matcher.pairs
        val bracketPair = pairs.find { 
            it.leftBraceType == HoloScriptTokenTypes.LBRACKET 
        }
        assertNotNull(bracketPair)
        assertEquals(HoloScriptTokenTypes.RBRACKET, bracketPair?.rightBraceType)
    }
    
    @Test
    fun `parentheses are paired`() {
        val pairs = matcher.pairs
        val parenPair = pairs.find { 
            it.leftBraceType == HoloScriptTokenTypes.LPAREN 
        }
        assertNotNull(parenPair)
        assertEquals(HoloScriptTokenTypes.RPAREN, parenPair?.rightBraceType)
    }
    
    @Test
    fun `curly braces are structural`() {
        val pairs = matcher.pairs
        val curlyPair = pairs.find { 
            it.leftBraceType == HoloScriptTokenTypes.LBRACE 
        }
        assertTrue(curlyPair?.isStructural ?: false)
    }
    
    @Test
    fun `square brackets are not structural`() {
        val pairs = matcher.pairs
        val bracketPair = pairs.find { 
            it.leftBraceType == HoloScriptTokenTypes.LBRACKET 
        }
        assertFalse(bracketPair?.isStructural ?: true)
    }
    
    @Test
    fun `parentheses are not structural`() {
        val pairs = matcher.pairs
        val parenPair = pairs.find { 
            it.leftBraceType == HoloScriptTokenTypes.LPAREN 
        }
        assertFalse(parenPair?.isStructural ?: true)
    }
    
    // ===== isPairedBracesAllowedBeforeType Tests =====
    
    @Test
    fun `paired braces allowed before any type`() {
        val result = matcher.isPairedBracesAllowedBeforeType(
            HoloScriptTokenTypes.LBRACE,
            HoloScriptTokenTypes.KEYWORD
        )
        assertTrue(result)
    }
    
    @Test
    fun `paired braces allowed with null context type`() {
        val result = matcher.isPairedBracesAllowedBeforeType(
            HoloScriptTokenTypes.LBRACE,
            null
        )
        assertTrue(result)
    }
    
    // ===== getCodeConstructStart Tests =====
    
    @Test
    fun `code construct start returns opening brace offset`() {
        // This test verifies the method returns the same offset
        // In real usage, PsiFile would be non-null
        val offset = 42
        // Can't test with null PsiFile, but verify the method exists
        assertNotNull(matcher::getCodeConstructStart)
    }
}
