using NUnit.Framework;
using UnityEngine;
using HoloScript.Editor;

namespace HoloScript.Tests.Editor
{
    /// <summary>
    /// Unit tests for HoloScript compiler editor functionality
    /// </summary>
    public class HoloScriptCompilerTests
    {
        private HoloScriptCompiler compiler;

        [SetUp]
        public void Setup()
        {
            compiler = new HoloScriptCompiler();
        }

        [Test]
        public void CompileToGameObject_SimpleObject_CreatesGameObject()
        {
            string source = @"
                object ""TestCube"" {
                    geometry: ""cube""
                    position: [0, 1, 0]
                }
            ";

            GameObject result = compiler.CompileToGameObject(source);

            Assert.IsNotNull(result);
            Assert.AreEqual("TestCube", result.name);

            Object.DestroyImmediate(result);
        }

        [Test]
        public void CompileToGameObject_WithTraits_AppliesTraits()
        {
            string source = @"
                object ""GrabbableCube"" @grabbable {
                    geometry: ""cube""
                }
            ";

            GameObject result = compiler.CompileToGameObject(source);

            var holoObject = result.GetComponent<HoloScript.Runtime.HoloScriptObject>();
            Assert.IsNotNull(holoObject);
            Assert.Contains("grabbable", holoObject.traits);

            Object.DestroyImmediate(result);
        }

        [Test]
        public void CompileToGameObject_WithPosition_SetsTransform()
        {
            string source = @"
                object ""Cube"" {
                    geometry: ""cube""
                    position: [1, 2, 3]
                }
            ";

            GameObject result = compiler.CompileToGameObject(source);

            Assert.AreEqual(new Vector3(1, 2, 3), result.transform.position);

            Object.DestroyImmediate(result);
        }

        [Test]
        public void CompileToGameObject_WithScale_SetsScale()
        {
            string source = @"
                object ""Cube"" {
                    geometry: ""cube""
                    scale: [2, 2, 2]
                }
            ";

            GameObject result = compiler.CompileToGameObject(source);

            Assert.AreEqual(new Vector3(2, 2, 2), result.transform.localScale);

            Object.DestroyImmediate(result);
        }

        [Test]
        public void CompileToGameObject_WithColor_SetsMaterial()
        {
            string source = @"
                object ""RedCube"" {
                    geometry: ""cube""
                    color: ""#ff0000""
                }
            ";

            GameObject result = compiler.CompileToGameObject(source);

            var renderer = result.GetComponent<MeshRenderer>();
            Assert.IsNotNull(renderer);
            Assert.IsNotNull(renderer.sharedMaterial);

            // Color should be approximately red
            Color color = renderer.sharedMaterial.color;
            Assert.AreEqual(1f, color.r, 0.01f);
            Assert.AreEqual(0f, color.g, 0.01f);
            Assert.AreEqual(0f, color.b, 0.01f);

            Object.DestroyImmediate(result);
        }

        [Test]
        public void CompileToGameObject_InvalidSyntax_ReturnsNull()
        {
            string invalidSource = @"
                object { missing name }
            ";

            GameObject result = compiler.CompileToGameObject(invalidSource);

            Assert.IsNull(result);
        }

        [Test]
        public void CompileToGameObject_Composition_CreatesHierarchy()
        {
            string source = @"
                composition ""Scene"" {
                    object ""Parent"" {
                        geometry: ""cube""
                        position: [0, 0, 0]
                    }
                }
            ";

            GameObject result = compiler.CompileToGameObject(source);

            Assert.IsNotNull(result);
            Assert.AreEqual("Scene", result.name);
            Assert.AreEqual(1, result.transform.childCount);

            Object.DestroyImmediate(result);
        }

        [Test]
        public void CompileToJson_ValidSource_ReturnsJson()
        {
            string source = @"
                object ""Cube"" {
                    geometry: ""cube""
                }
            ";

            string json = compiler.CompileToJson(source);

            Assert.IsNotNull(json);
            Assert.IsTrue(json.Contains("\"geometry\""));
            Assert.IsTrue(json.Contains("\"cube\""));
        }

        [Test]
        public void CompileToJson_InvalidSource_ReturnsErrorJson()
        {
            string invalidSource = "invalid syntax {{{";

            string json = compiler.CompileToJson(invalidSource);

            Assert.IsNotNull(json);
            Assert.IsTrue(json.Contains("error") || json.Contains("errors"));
        }

        [Test]
        public void GetGeometry_Cube_ReturnsCubeMesh()
        {
            PrimitiveType geometry = compiler.GetGeometry("cube");
            Assert.AreEqual(PrimitiveType.Cube, geometry);
        }

        [Test]
        public void GetGeometry_Sphere_ReturnsSphereMesh()
        {
            PrimitiveType geometry = compiler.GetGeometry("sphere");
            Assert.AreEqual(PrimitiveType.Sphere, geometry);
        }

        [Test]
        public void GetGeometry_Unknown_ReturnsCubeDefault()
        {
            PrimitiveType geometry = compiler.GetGeometry("unknown_shape");
            Assert.AreEqual(PrimitiveType.Cube, geometry);
        }
    }
}
