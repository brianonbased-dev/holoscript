; tree-sitter-holoscript/queries/indents.scm
; Indentation queries for HoloScript

; =============================================================================
; INDENT ON OPEN BRACE
; =============================================================================

; Top-level definitions
(composition "{" @indent)
(world "{" @indent)
(template "{" @indent)
(object "{" @indent)
(entity "{" @indent)
(action "{" @indent)
(trait_definition "{" @indent)

; Nested blocks
(environment "{" @indent)
(state_block "{" @indent)
(networked_block "{" @indent)
(physics_block "{" @indent)
(animation "{" @indent)
(timeline "{" @indent)
(logic "{" @indent)
(spatial_group "{" @indent)
(component "{" @indent)

; Control flow
(block "{" @indent)
(if_statement "{" @indent)
(for_loop "{" @indent)
(while_loop "{" @indent)

; Literals
(array "[" @indent)
(object_literal "{" @indent)

; =============================================================================
; DEDENT ON CLOSE BRACE
; =============================================================================

"}" @dedent
"]" @dedent

; =============================================================================
; ALIGN RULES
; =============================================================================

; Align properties
(property) @align

; Align array elements
(array (_) @align)

; Align function arguments
(function_call
  "(" @align_start
  (argument) @align
  ")" @align_end)

; =============================================================================
; SPECIAL CASES
; =============================================================================

; Keep else on same indent level as if
(if_statement
  "else" @branch)

; Continue statements don't change indent
(return_statement) @same_line
