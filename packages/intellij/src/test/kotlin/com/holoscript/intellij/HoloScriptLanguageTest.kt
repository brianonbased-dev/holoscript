package com.holoscript.intellij

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*

/**
 * Tests for HoloScriptLanguage
 */
class HoloScriptLanguageTest {
    
    @Test
    fun `language has correct display name`() {
        assertEquals("HoloScript", HoloScriptLanguage.displayName)
    }
    
    @Test
    fun `language is case sensitive`() {
        assertTrue(HoloScriptLanguage.isCaseSensitive)
    }
    
    @Test
    fun `language has associated file type`() {
        assertNotNull(HoloScriptLanguage.associatedFileType)
        assertEquals(HoloScriptFileType.INSTANCE, HoloScriptLanguage.associatedFileType)
    }
}
