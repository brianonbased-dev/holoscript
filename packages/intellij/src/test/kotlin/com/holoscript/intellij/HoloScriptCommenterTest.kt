package com.holoscript.intellij

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach

/**
 * Tests for HoloScriptCommenter
 */
class HoloScriptCommenterTest {
    
    private lateinit var commenter: HoloScriptCommenter
    
    @BeforeEach
    fun setup() {
        commenter = HoloScriptCommenter()
    }
    
    // ===== Line Comment Tests =====
    
    @Test
    fun `line comment prefix is double slash`() {
        assertEquals("//", commenter.lineCommentPrefix)
    }
    
    @Test
    fun `line comment prefix is not null`() {
        assertNotNull(commenter.lineCommentPrefix)
    }
    
    // ===== Block Comment Tests =====
    
    @Test
    fun `block comment prefix is slash asterisk`() {
        assertEquals("/*", commenter.blockCommentPrefix)
    }
    
    @Test
    fun `block comment suffix is asterisk slash`() {
        assertEquals("*/", commenter.blockCommentSuffix)
    }
    
    @Test
    fun `block comment prefix is not null`() {
        assertNotNull(commenter.blockCommentPrefix)
    }
    
    @Test
    fun `block comment suffix is not null`() {
        assertNotNull(commenter.blockCommentSuffix)
    }
    
    // ===== Commented Block Comment Tests =====
    
    @Test
    fun `commented block comment prefix is null`() {
        assertNull(commenter.commentedBlockCommentPrefix)
    }
    
    @Test
    fun `commented block comment suffix is null`() {
        assertNull(commenter.commentedBlockCommentSuffix)
    }
    
    // ===== Implementation Tests =====
    
    @Test
    fun `commenter implements Commenter interface`() {
        assertTrue(commenter is com.intellij.lang.Commenter)
    }
}
