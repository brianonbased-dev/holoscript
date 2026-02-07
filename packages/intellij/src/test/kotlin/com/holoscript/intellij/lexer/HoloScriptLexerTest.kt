package com.holoscript.intellij.lexer

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach

/**
 * Tests for HoloScriptLexer
 */
class HoloScriptLexerTest {
    
    private lateinit var lexer: HoloScriptLexer
    
    @BeforeEach
    fun setup() {
        lexer = HoloScriptLexer()
    }
    
    // ===== Token Type Tests =====
    
    @Test
    fun `keyword token type exists`() {
        assertNotNull(HoloScriptTokenTypes.KEYWORD)
        assertEquals("KEYWORD", HoloScriptTokenTypes.KEYWORD.toString())
    }
    
    @Test
    fun `trait token type exists`() {
        assertNotNull(HoloScriptTokenTypes.TRAIT)
        assertEquals("TRAIT", HoloScriptTokenTypes.TRAIT.toString())
    }
    
    @Test
    fun `string token type exists`() {
        assertNotNull(HoloScriptTokenTypes.STRING)
        assertEquals("STRING", HoloScriptTokenTypes.STRING.toString())
    }
    
    @Test
    fun `number token type exists`() {
        assertNotNull(HoloScriptTokenTypes.NUMBER)
        assertEquals("NUMBER", HoloScriptTokenTypes.NUMBER.toString())
    }
    
    @Test
    fun `comment token types exist`() {
        assertNotNull(HoloScriptTokenTypes.LINE_COMMENT)
        assertNotNull(HoloScriptTokenTypes.BLOCK_COMMENT)
    }
    
    @Test
    fun `bracket token types exist`() {
        assertNotNull(HoloScriptTokenTypes.LBRACE)
        assertNotNull(HoloScriptTokenTypes.RBRACE)
        assertNotNull(HoloScriptTokenTypes.LBRACKET)
        assertNotNull(HoloScriptTokenTypes.RBRACKET)
        assertNotNull(HoloScriptTokenTypes.LPAREN)
        assertNotNull(HoloScriptTokenTypes.RPAREN)
    }
    
    @Test
    fun `identifier token type exists`() {
        assertNotNull(HoloScriptTokenTypes.IDENTIFIER)
    }
    
    @Test
    fun `operator token types exist`() {
        assertNotNull(HoloScriptTokenTypes.OPERATOR)
        assertNotNull(HoloScriptTokenTypes.COLON)
        assertNotNull(HoloScriptTokenTypes.COMMA)
        assertNotNull(HoloScriptTokenTypes.DOT)
    }
    
    @Test
    fun `whitespace token types exist`() {
        assertNotNull(HoloScriptTokenTypes.WHITESPACE)
        assertNotNull(HoloScriptTokenTypes.NEWLINE)
    }
    
    @Test
    fun `bad character token type exists`() {
        assertNotNull(HoloScriptTokenTypes.BAD_CHARACTER)
    }
    
    // ===== Lexer Initialization Tests =====
    
    @Test
    fun `lexer starts with empty source`() {
        lexer.start("", 0, 0, 0)
        assertNull(lexer.tokenType)
    }
    
    @Test
    fun `lexer state is zero`() {
        lexer.start("orb test {}", 0, 11, 0)
        assertEquals(0, lexer.state)
    }
    
    // ===== Token Recognition Tests =====
    
    @Test
    fun `lexer tokenizes keyword`() {
        val source = "orb"
        lexer.start(source, 0, source.length, 0)
        assertEquals(HoloScriptTokenTypes.KEYWORD, lexer.tokenType)
    }
    
    @Test
    fun `lexer tokenizes string literal`() {
        val source = "\"hello world\""
        lexer.start(source, 0, source.length, 0)
        assertEquals(HoloScriptTokenTypes.STRING, lexer.tokenType)
    }
    
    @Test
    fun `lexer tokenizes number`() {
        val source = "42"
        lexer.start(source, 0, source.length, 0)
        assertEquals(HoloScriptTokenTypes.NUMBER, lexer.tokenType)
    }
    
    @Test
    fun `lexer tokenizes trait`() {
        val source = "@grabbable"
        lexer.start(source, 0, source.length, 0)
        assertEquals(HoloScriptTokenTypes.TRAIT, lexer.tokenType)
    }
    
    @Test
    fun `lexer tokenizes braces`() {
        val source = "{"
        lexer.start(source, 0, source.length, 0)
        assertEquals(HoloScriptTokenTypes.LBRACE, lexer.tokenType)
    }
    
    @Test
    fun `lexer tokenizes line comment`() {
        val source = "// comment"
        lexer.start(source, 0, source.length, 0)
        assertEquals(HoloScriptTokenTypes.LINE_COMMENT, lexer.tokenType)
    }
    
    @Test
    fun `lexer tokenizes colon`() {
        val source = ":"
        lexer.start(source, 0, source.length, 0)
        assertEquals(HoloScriptTokenTypes.COLON, lexer.tokenType)
    }
    
    // ===== Advance Tests =====
    
    @Test
    fun `lexer advances through tokens`() {
        val source = "orb test"
        lexer.start(source, 0, source.length, 0)
        
        // First token: 'orb'
        assertEquals(HoloScriptTokenTypes.KEYWORD, lexer.tokenType)
        lexer.advance()
        
        // Second token: whitespace
        assertEquals(HoloScriptTokenTypes.WHITESPACE, lexer.tokenType)
        lexer.advance()
        
        // Third token: 'test'
        assertEquals(HoloScriptTokenTypes.IDENTIFIER, lexer.tokenType)
    }
    
    @Test
    fun `lexer reports correct token positions`() {
        val source = "orb"
        lexer.start(source, 0, source.length, 0)
        assertEquals(0, lexer.tokenStart)
        assertEquals(3, lexer.tokenEnd)
    }
}
