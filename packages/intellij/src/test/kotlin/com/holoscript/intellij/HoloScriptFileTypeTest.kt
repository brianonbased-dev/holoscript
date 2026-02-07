package com.holoscript.intellij

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*

/**
 * Tests for HoloScriptFileType
 */
class HoloScriptFileTypeTest {
    
    @Test
    fun `file type has correct name`() {
        assertEquals("HoloScript", HoloScriptFileType.INSTANCE.name)
    }
    
    @Test
    fun `file type has correct description`() {
        assertEquals("HoloScript language file", HoloScriptFileType.INSTANCE.description)
    }
    
    @Test
    fun `default extension is hsplus`() {
        assertEquals("hsplus", HoloScriptFileType.INSTANCE.defaultExtension)
    }
    
    @Test
    fun `file type is singleton`() {
        assertSame(HoloScriptFileType.INSTANCE, HoloScriptFileType.INSTANCE)
    }
    
    @Test
    fun `file type has associated language`() {
        assertEquals(HoloScriptLanguage, HoloScriptFileType.INSTANCE.language)
    }
}
