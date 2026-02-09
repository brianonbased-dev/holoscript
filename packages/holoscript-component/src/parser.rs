//! Parser for HoloScript that produces WIT-compatible AST nodes.

use crate::lexer::{tokenize, SpannedToken, Token, get_line_col};
use crate::exports::holoscript::core::parser::{
    CompositionNode, ObjectNode, TemplateNode, GroupNode, AnimationNode,
    TimelineNode, LightNode, CameraNode, PropertyValue, EnvironmentSettings,
    Span, Position, Diagnostic, DiagnosticSeverity,
};

/// Parse HoloScript source into a CompositionNode
pub fn parse_holoscript(source: &str) -> Result<CompositionNode, Vec<Diagnostic>> {
    let tokens = match tokenize(source) {
        Ok(t) => t,
        Err(errors) => {
            return Err(errors.into_iter().map(|(span, msg)| {
                let (line, col) = get_line_col(source, span.start);
                Diagnostic {
                    severity: DiagnosticSeverity::Error,
                    message: msg,
                    span: Span {
                        start: Position { line: line as u32, column: col as u32, offset: span.start as u32 },
                        end: Position { line: line as u32, column: (col + span.end - span.start) as u32, offset: span.end as u32 },
                    },
                    code: Some("E001".to_string()),
                }
            }).collect());
        }
    };
    
    let mut parser = Parser::new(source, tokens);
    parser.parse_composition()
}

/// Parse just the header (composition name)
pub fn parse_header(source: &str) -> Result<String, String> {
    let tokens = tokenize(source).map_err(|e| e[0].1.clone())?;
    let mut parser = Parser::new(source, tokens);
    parser.parse_composition_header()
}

/// Validate source and return diagnostics
pub fn validate_holoscript(source: &str) -> (bool, Vec<Diagnostic>) {
    match parse_holoscript(source) {
        Ok(_) => (true, vec![]),
        Err(errors) => (false, errors),
    }
}

struct Parser<'a> {
    source: &'a str,
    tokens: Vec<SpannedToken>,
    pos: usize,
}

impl<'a> Parser<'a> {
    fn new(source: &'a str, tokens: Vec<SpannedToken>) -> Self {
        Self { source, tokens, pos: 0 }
    }
    
    fn current(&self) -> Option<&SpannedToken> {
        self.tokens.get(self.pos)
    }
    
    fn advance(&mut self) -> Option<&SpannedToken> {
        let tok = self.tokens.get(self.pos);
        self.pos += 1;
        tok
    }
    
    fn expect_token(&mut self, expected: &Token) -> Result<&SpannedToken, Diagnostic> {
        match self.current() {
            Some(tok) if std::mem::discriminant(&tok.token) == std::mem::discriminant(expected) => {
                Ok(self.advance().unwrap())
            }
            Some(tok) => {
                let (line, col) = get_line_col(self.source, tok.span.start);
                Err(Diagnostic {
                    severity: DiagnosticSeverity::Error,
                    message: format!("Expected {:?}, found {:?}", expected, tok.token),
                    span: Span {
                        start: Position { line: line as u32, column: col as u32, offset: tok.span.start as u32 },
                        end: Position { line: line as u32, column: (col + tok.span.end - tok.span.start) as u32, offset: tok.span.end as u32 },
                    },
                    code: Some("E002".to_string()),
                })
            }
            None => {
                Err(Diagnostic {
                    severity: DiagnosticSeverity::Error,
                    message: format!("Unexpected end of file, expected {:?}", expected),
                    span: Span {
                        start: Position { line: 1, column: 1, offset: 0 },
                        end: Position { line: 1, column: 1, offset: 0 },
                    },
                    code: Some("E003".to_string()),
                })
            }
        }
    }
    
    fn parse_composition_header(&mut self) -> Result<String, String> {
        // Expect: composition "Name"
        match self.current() {
            Some(SpannedToken { token: Token::Composition, .. }) => {
                self.advance();
            }
            _ => return Err("Expected 'composition' keyword".to_string()),
        }
        
        match self.current() {
            Some(SpannedToken { token: Token::String(name), .. }) |
            Some(SpannedToken { token: Token::SingleQuoteString(name), .. }) => {
                Ok(name.clone())
            }
            _ => Err("Expected composition name string".to_string()),
        }
    }
    
    fn parse_composition(&mut self) -> Result<CompositionNode, Vec<Diagnostic>> {
        let mut errors = Vec::new();
        
        // composition "Name" { ... }
        if !matches!(self.current(), Some(SpannedToken { token: Token::Composition, .. })) {
            return Err(vec![self.error("Expected 'composition' keyword")]);
        }
        
        let start_span = self.current().map(|t| &t.span).cloned();
        self.advance();
        
        let name = match self.current() {
            Some(SpannedToken { token: Token::String(n), .. }) |
            Some(SpannedToken { token: Token::SingleQuoteString(n), .. }) => {
                let n = n.clone();
                self.advance();
                n
            }
            _ => {
                errors.push(self.error("Expected composition name"));
                "Unnamed".to_string()
            }
        };
        
        // Expect opening brace
        if let Err(e) = self.expect_token(&Token::LBrace) {
            errors.push(e);
        }
        
        // Parse composition body
        let mut templates = Vec::new();
        let mut objects = Vec::new();
        let mut groups = Vec::new();
        let mut animations = Vec::new();
        let mut timelines = Vec::new();
        let mut lights = Vec::new();
        let mut cameras = Vec::new();
        let mut environment = None;
        
        while let Some(tok) = self.current() {
            if matches!(tok.token, Token::RBrace) {
                break;
            }
            
            match &tok.token {
                Token::Template => {
                    match self.parse_template() {
                        Ok(t) => templates.push(t),
                        Err(e) => errors.push(e),
                    }
                }
                Token::Object => {
                    match self.parse_object() {
                        Ok(o) => objects.push(o),
                        Err(e) => errors.push(e),
                    }
                }
                Token::Environment => {
                    match self.parse_environment() {
                        Ok(e) => environment = Some(e),
                        Err(e) => errors.push(e),
                    }
                }
                Token::SpatialGroup => {
                    match self.parse_group() {
                        Ok(g) => groups.push(g),
                        Err(e) => errors.push(e),
                    }
                }
                Token::Animation => {
                    match self.parse_animation() {
                        Ok(a) => animations.push(a),
                        Err(e) => errors.push(e),
                    }
                }
                Token::Timeline => {
                    match self.parse_timeline() {
                        Ok(t) => timelines.push(t),
                        Err(e) => errors.push(e),
                    }
                }
                Token::DirectionalLight | Token::PointLight | Token::SpotLight | Token::AmbientLight => {
                    match self.parse_light() {
                        Ok(l) => lights.push(l),
                        Err(e) => errors.push(e),
                    }
                }
                Token::PerspectiveCamera | Token::OrthographicCamera => {
                    match self.parse_camera() {
                        Ok(c) => cameras.push(c),
                        Err(e) => errors.push(e),
                    }
                }
                Token::Logic => {
                    // Skip logic blocks for now
                    self.skip_block();
                }
                _ => {
                    // Unknown token, try to skip
                    self.advance();
                }
            }
        }
        
        // Expect closing brace
        if let Err(e) = self.expect_token(&Token::RBrace) {
            errors.push(e);
        }
        
        if !errors.is_empty() {
            return Err(errors);
        }
        
        Ok(CompositionNode {
            name,
            templates,
            objects,
            groups,
            animations,
            timelines,
            lights,
            cameras,
            environment,
            span: start_span.map(|s| Span {
                start: Position { line: 1, column: 1, offset: s.start as u32 },
                end: Position { line: 1, column: 1, offset: s.end as u32 },
            }),
        })
    }
    
    fn parse_template(&mut self) -> Result<TemplateNode, Diagnostic> {
        // template "Name" { ... }
        self.advance(); // consume 'template'
        
        let name = match self.current() {
            Some(SpannedToken { token: Token::String(n), .. }) |
            Some(SpannedToken { token: Token::SingleQuoteString(n), .. }) => {
                let n = n.clone();
                self.advance();
                n
            }
            _ => return Err(self.error("Expected template name")),
        };
        
        // Collect traits
        let mut traits = Vec::new();
        while let Some(SpannedToken { token: Token::Trait(t), .. }) = self.current() {
            traits.push(t.clone());
            self.advance();
        }
        
        self.expect_token(&Token::LBrace)?;
        
        // Parse properties
        let properties = self.parse_properties()?;
        
        self.expect_token(&Token::RBrace)?;
        
        Ok(TemplateNode {
            name,
            traits,
            properties,
            extends: None,
            span: None,
        })
    }
    
    fn parse_object(&mut self) -> Result<ObjectNode, Diagnostic> {
        // object "Name" @traits { ... }
        self.advance(); // consume 'object'
        
        let name = match self.current() {
            Some(SpannedToken { token: Token::String(n), .. }) |
            Some(SpannedToken { token: Token::SingleQuoteString(n), .. }) => {
                let n = n.clone();
                self.advance();
                n
            }
            _ => return Err(self.error("Expected object name")),
        };
        
        // Collect traits
        let mut traits = Vec::new();
        while let Some(SpannedToken { token: Token::Trait(t), .. }) = self.current() {
            traits.push(t.clone());
            self.advance();
        }
        
        // Check for "using" template
        let mut template = None;
        if let Some(SpannedToken { token: Token::Using, .. }) = self.current() {
            self.advance();
            if let Some(SpannedToken { token: Token::String(t), .. }) | 
               Some(SpannedToken { token: Token::SingleQuoteString(t), .. }) = self.current() {
                template = Some(t.clone());
                self.advance();
            }
        }
        
        self.expect_token(&Token::LBrace)?;
        
        // Parse properties
        let properties = self.parse_properties()?;
        
        self.expect_token(&Token::RBrace)?;
        
        Ok(ObjectNode {
            name,
            traits,
            template,
            properties,
            span: None,
        })
    }
    
    fn parse_properties(&mut self) -> Result<Vec<(String, PropertyValue)>, Diagnostic> {
        let mut properties = Vec::new();
        
        while let Some(tok) = self.current() {
            if matches!(tok.token, Token::RBrace) {
                break;
            }
            
            // Property name
            let prop_name = match &tok.token {
                Token::Identifier(id) => {
                    let id = id.clone();
                    self.advance();
                    id
                }
                _ => break,
            };
            
            // Colon
            if let Err(_) = self.expect_token(&Token::Colon) {
                continue;
            }
            
            // Value
            let value = self.parse_value()?;
            properties.push((prop_name, value));
        }
        
        Ok(properties)
    }
    
    fn parse_value(&mut self) -> Result<PropertyValue, Diagnostic> {
        match self.current() {
            Some(SpannedToken { token: Token::String(s), .. }) |
            Some(SpannedToken { token: Token::SingleQuoteString(s), .. }) => {
                let s = s.clone();
                self.advance();
                Ok(PropertyValue::Str(s))
            }
            Some(SpannedToken { token: Token::Number(n), .. }) => {
                let n = *n;
                self.advance();
                Ok(PropertyValue::Number(n))
            }
            Some(SpannedToken { token: Token::True, .. }) => {
                self.advance();
                Ok(PropertyValue::Bool(true))
            }
            Some(SpannedToken { token: Token::False, .. }) => {
                self.advance();
                Ok(PropertyValue::Bool(false))
            }
            Some(SpannedToken { token: Token::Null, .. }) => {
                self.advance();
                Ok(PropertyValue::Null)
            }
            Some(SpannedToken { token: Token::LBracket, .. }) => {
                self.parse_array()
            }
            Some(SpannedToken { token: Token::LBrace, .. }) => {
                self.parse_object_value()
            }
            Some(SpannedToken { token: Token::Identifier(id), .. }) => {
                let id = id.clone();
                self.advance();
                Ok(PropertyValue::Reference(id))
            }
            _ => Err(self.error("Expected value")),
        }
    }
    
    fn parse_array(&mut self) -> Result<PropertyValue, Diagnostic> {
        self.advance(); // consume '['
        let mut values = Vec::new();
        
        while let Some(tok) = self.current() {
            if matches!(tok.token, Token::RBracket) {
                break;
            }
            
            values.push(self.parse_value()?);
            
            // Optional comma
            if matches!(self.current(), Some(SpannedToken { token: Token::Comma, .. })) {
                self.advance();
            }
        }
        
        self.expect_token(&Token::RBracket)?;
        Ok(PropertyValue::Array(values))
    }
    
    fn parse_object_value(&mut self) -> Result<PropertyValue, Diagnostic> {
        self.advance(); // consume '{'
        let properties = self.parse_properties()?;
        self.expect_token(&Token::RBrace)?;
        Ok(PropertyValue::Object(properties))
    }
    
    fn parse_environment(&mut self) -> Result<EnvironmentSettings, Diagnostic> {
        self.advance(); // consume 'environment'
        self.expect_token(&Token::LBrace)?;
        
        let mut skybox = None;
        let mut ambient_light = None;
        let mut fog = None;
        let mut gravity = None;
        
        while let Some(tok) = self.current() {
            if matches!(tok.token, Token::RBrace) {
                break;
            }
            
            let prop_name = match &tok.token {
                Token::Identifier(id) => {
                    let id = id.clone();
                    self.advance();
                    id
                }
                _ => break,
            };
            
            self.expect_token(&Token::Colon)?;
            
            match prop_name.as_str() {
                "skybox" => {
                    if let Some(SpannedToken { token: Token::String(s), .. }) |
                       Some(SpannedToken { token: Token::SingleQuoteString(s), .. }) = self.current() {
                        skybox = Some(s.clone());
                        self.advance();
                    }
                }
                "ambient_light" => {
                    if let Some(SpannedToken { token: Token::Number(n), .. }) = self.current() {
                        ambient_light = Some(*n as f32);
                        self.advance();
                    }
                }
                "fog" => {
                    fog = Some(true);
                    self.parse_value()?; // Skip the value
                }
                "gravity" => {
                    if let Some(SpannedToken { token: Token::Number(n), .. }) = self.current() {
                        gravity = Some(*n as f32);
                        self.advance();
                    }
                }
                _ => {
                    self.parse_value()?; // Skip unknown properties
                }
            }
        }
        
        self.expect_token(&Token::RBrace)?;
        
        Ok(EnvironmentSettings {
            skybox,
            ambient_light,
            fog,
            gravity,
        })
    }
    
    fn parse_group(&mut self) -> Result<GroupNode, Diagnostic> {
        self.advance(); // consume 'spatial_group'
        
        let name = match self.current() {
            Some(SpannedToken { token: Token::String(n), .. }) |
            Some(SpannedToken { token: Token::SingleQuoteString(n), .. }) => {
                let n = n.clone();
                self.advance();
                n
            }
            _ => return Err(self.error("Expected group name")),
        };
        
        self.expect_token(&Token::LBrace)?;
        
        let mut children = Vec::new();
        while let Some(tok) = self.current() {
            if matches!(tok.token, Token::RBrace) {
                break;
            }
            if matches!(tok.token, Token::Object) {
                children.push(self.parse_object()?);
            } else {
                self.advance();
            }
        }
        
        self.expect_token(&Token::RBrace)?;
        
        Ok(GroupNode {
            name,
            children,
            position: None,
            span: None,
        })
    }
    
    fn parse_animation(&mut self) -> Result<AnimationNode, Diagnostic> {
        self.advance(); // consume 'animation'
        
        let name = match self.current() {
            Some(SpannedToken { token: Token::String(n), .. }) |
            Some(SpannedToken { token: Token::SingleQuoteString(n), .. }) |
            Some(SpannedToken { token: Token::Identifier(n), .. }) => {
                let n = n.clone();
                self.advance();
                n
            }
            _ => return Err(self.error("Expected animation name")),
        };
        
        self.expect_token(&Token::LBrace)?;
        
        let mut property = None;
        let mut duration = 1000;
        let mut easing = "linear".to_string();
        let mut from = None;
        let mut to = None;
        let mut r#loop = false;
        
        while let Some(tok) = self.current() {
            if matches!(tok.token, Token::RBrace) {
                break;
            }
            
            let prop_name = match &tok.token {
                Token::Identifier(id) => {
                    let id = id.clone();
                    self.advance();
                    id
                }
                _ => break,
            };
            
            self.expect_token(&Token::Colon)?;
            
            match prop_name.as_str() {
                "property" => {
                    if let Ok(PropertyValue::Str(s)) = self.parse_value() {
                        property = Some(s);
                    }
                }
                "duration" => {
                    if let Ok(PropertyValue::Number(n)) = self.parse_value() {
                        duration = n as u32;
                    }
                }
                "easing" => {
                    if let Ok(PropertyValue::Str(s)) = self.parse_value() {
                        easing = s;
                    }
                }
                "from" => {
                    from = Some(self.parse_value()?);
                }
                "to" => {
                    to = Some(self.parse_value()?);
                }
                "loop" => {
                    if let Ok(PropertyValue::Bool(b)) = self.parse_value() {
                        r#loop = b;
                    } else if let Ok(PropertyValue::Reference(s)) = self.parse_value() {
                        r#loop = s == "infinite" || s == "true";
                    }
                }
                _ => {
                    self.parse_value()?;
                }
            }
        }
        
        self.expect_token(&Token::RBrace)?;
        
        Ok(AnimationNode {
            name,
            property: property.unwrap_or_default(),
            from,
            to,
            duration,
            easing,
            r#loop,
            span: None,
        })
    }
    
    fn parse_timeline(&mut self) -> Result<TimelineNode, Diagnostic> {
        self.advance(); // consume 'timeline'
        
        let name = match self.current() {
            Some(SpannedToken { token: Token::String(n), .. }) |
            Some(SpannedToken { token: Token::SingleQuoteString(n), .. }) |
            Some(SpannedToken { token: Token::Identifier(n), .. }) => {
                let n = n.clone();
                self.advance();
                n
            }
            _ => return Err(self.error("Expected timeline name")),
        };
        
        self.expect_token(&Token::LBrace)?;
        self.skip_block_contents();
        self.expect_token(&Token::RBrace)?;
        
        Ok(TimelineNode {
            name,
            keyframes: vec![],
            r#loop: false,
            span: None,
        })
    }
    
    fn parse_light(&mut self) -> Result<LightNode, Diagnostic> {
        let light_type = match self.current() {
            Some(SpannedToken { token: Token::DirectionalLight, .. }) => "directional",
            Some(SpannedToken { token: Token::PointLight, .. }) => "point",
            Some(SpannedToken { token: Token::SpotLight, .. }) => "spot",
            Some(SpannedToken { token: Token::AmbientLight, .. }) => "ambient",
            _ => return Err(self.error("Expected light type")),
        };
        self.advance();
        
        let name = match self.current() {
            Some(SpannedToken { token: Token::String(n), .. }) |
            Some(SpannedToken { token: Token::SingleQuoteString(n), .. }) => {
                let n = n.clone();
                self.advance();
                n
            }
            _ => return Err(self.error("Expected light name")),
        };
        
        self.expect_token(&Token::LBrace)?;
        let properties = self.parse_properties()?;
        self.expect_token(&Token::RBrace)?;
        
        Ok(LightNode {
            name,
            light_type: light_type.to_string(),
            properties,
            span: None,
        })
    }
    
    fn parse_camera(&mut self) -> Result<CameraNode, Diagnostic> {
        let camera_type = match self.current() {
            Some(SpannedToken { token: Token::PerspectiveCamera, .. }) => "perspective",
            Some(SpannedToken { token: Token::OrthographicCamera, .. }) => "orthographic",
            _ => return Err(self.error("Expected camera type")),
        };
        self.advance();
        
        let name = match self.current() {
            Some(SpannedToken { token: Token::String(n), .. }) |
            Some(SpannedToken { token: Token::SingleQuoteString(n), .. }) => {
                let n = n.clone();
                self.advance();
                n
            }
            _ => return Err(self.error("Expected camera name")),
        };
        
        self.expect_token(&Token::LBrace)?;
        let properties = self.parse_properties()?;
        self.expect_token(&Token::RBrace)?;
        
        Ok(CameraNode {
            name,
            camera_type: camera_type.to_string(),
            properties,
            span: None,
        })
    }
    
    fn skip_block(&mut self) {
        self.advance(); // consume keyword
        
        // Skip to opening brace
        while let Some(tok) = self.current() {
            if matches!(tok.token, Token::LBrace) {
                break;
            }
            self.advance();
        }
        
        if matches!(self.current(), Some(SpannedToken { token: Token::LBrace, .. })) {
            self.advance();
            self.skip_block_contents();
            self.advance(); // closing brace
        }
    }
    
    fn skip_block_contents(&mut self) {
        let mut depth = 1;
        while let Some(tok) = self.current() {
            match tok.token {
                Token::LBrace => depth += 1,
                Token::RBrace => {
                    depth -= 1;
                    if depth == 0 {
                        return;
                    }
                }
                _ => {}
            }
            self.advance();
        }
    }
    
    fn error(&self, message: &str) -> Diagnostic {
        let (line, col, offset) = match self.current() {
            Some(tok) => {
                let (l, c) = get_line_col(self.source, tok.span.start);
                (l as u32, c as u32, tok.span.start as u32)
            }
            None => (1, 1, self.source.len() as u32),
        };
        
        Diagnostic {
            severity: DiagnosticSeverity::Error,
            message: message.to_string(),
            span: Span {
                start: Position { line, column: col, offset },
                end: Position { line, column: col + 1, offset: offset + 1 },
            },
            code: Some("E000".to_string()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_parse_simple_composition() {
        let source = r#"composition "Test" {
            object "Cube" @grabbable {
                geometry: "cube"
                position: [0, 1, 0]
            }
        }"#;
        
        let result = parse_holoscript(source);
        assert!(result.is_ok());
        
        let comp = result.unwrap();
        assert_eq!(comp.name, "Test");
        assert_eq!(comp.objects.len(), 1);
        assert_eq!(comp.objects[0].name, "Cube");
        assert_eq!(comp.objects[0].traits, vec!["grabbable"]);
    }
    
    #[test]
    fn test_parse_with_template() {
        let source = r#"composition "Demo" {
            template "Ball" {
                geometry: "sphere"
                color: "#ff0000"
            }
            
            object "RedBall" using "Ball" {
                position: [0, 2, 0]
            }
        }"#;
        
        let result = parse_holoscript(source);
        assert!(result.is_ok());
        
        let comp = result.unwrap();
        assert_eq!(comp.templates.len(), 1);
        assert_eq!(comp.templates[0].name, "Ball");
        assert_eq!(comp.objects[0].template, Some("Ball".to_string()));
    }
    
    #[test]
    fn test_parse_environment() {
        let source = r#"composition "Scene" {
            environment {
                skybox: "gradient"
                ambient_light: 0.5
            }
        }"#;
        
        let result = parse_holoscript(source);
        assert!(result.is_ok());
        
        let comp = result.unwrap();
        assert!(comp.environment.is_some());
        let env = comp.environment.unwrap();
        assert_eq!(env.skybox, Some("gradient".to_string()));
        assert_eq!(env.ambient_light, Some(0.5));
    }
    
    #[test]
    fn test_invalid_syntax_error() {
        let source = r#"composition { }"#; // Missing name
        
        let result = parse_holoscript(source);
        assert!(result.is_err());
    }
}
