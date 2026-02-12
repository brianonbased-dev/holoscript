using NUnit.Framework;
using UnityEngine;
using HoloScript.Runtime;

namespace HoloScript.Tests.Runtime
{
    /// <summary>
    /// Unit tests for HoloScriptObject runtime component
    /// </summary>
    public class HoloScriptObjectTests
    {
        private GameObject testObject;
        private HoloScriptObject holoScriptObject;

        [SetUp]
        public void Setup()
        {
            testObject = new GameObject("TestObject");
            holoScriptObject = testObject.AddComponent<HoloScriptObject>();
        }

        [TearDown]
        public void Teardown()
        {
            Object.DestroyImmediate(testObject);
        }

        [Test]
        public void ObjectName_CanBeSet()
        {
            holoScriptObject.objectName = "TestCube";
            Assert.AreEqual("TestCube", holoScriptObject.objectName);
        }

        [Test]
        public void Traits_CanBeAssigned()
        {
            holoScriptObject.traits = new string[] { "grabbable", "throwable" };
            Assert.AreEqual(2, holoScriptObject.traits.Length);
            Assert.Contains("grabbable", holoScriptObject.traits);
        }

        [Test]
        public void HasTrait_ReturnsTrueForExistingTrait()
        {
            holoScriptObject.traits = new string[] { "grabbable", "glowing" };
            Assert.IsTrue(holoScriptObject.HasTrait("grabbable"));
            Assert.IsTrue(holoScriptObject.HasTrait("glowing"));
        }

        [Test]
        public void HasTrait_ReturnsFalseForMissingTrait()
        {
            holoScriptObject.traits = new string[] { "grabbable" };
            Assert.IsFalse(holoScriptObject.HasTrait("throwable"));
        }

        [Test]
        public void ApplyGrabbableTrait_AddsInteractableComponent()
        {
            holoScriptObject.traits = new string[] { "grabbable" };
            holoScriptObject.ApplyTraits();

            // Should have added XR Interactable component
            var interactable = testObject.GetComponent<UnityEngine.XR.Interaction.Toolkit.Interactables.XRGrabInteractable>();
            Assert.IsNotNull(interactable, "Grabbable trait should add XRGrabInteractable component");
        }

        [Test]
        public void ApplyThrowableTrait_AddsRigidbody()
        {
            holoScriptObject.traits = new string[] { "throwable" };
            holoScriptObject.ApplyTraits();

            var rigidbody = testObject.GetComponent<Rigidbody>();
            Assert.IsNotNull(rigidbody, "Throwable trait should add Rigidbody component");
        }

        [Test]
        public void ApplyMultipleTraits_AddsAllComponents()
        {
            holoScriptObject.traits = new string[] { "grabbable", "throwable" };
            holoScriptObject.ApplyTraits();

            Assert.IsNotNull(testObject.GetComponent<Rigidbody>());
            Assert.IsNotNull(testObject.GetComponent<UnityEngine.XR.Interaction.Toolkit.Interactables.XRGrabInteractable>());
        }

        [Test]
        public void IsGrabbable_ReflectsTrait()
        {
            holoScriptObject.traits = new string[] { "grabbable" };
            holoScriptObject.ApplyTraits();

            Assert.IsTrue(holoScriptObject.isGrabbable);
        }

        [Test]
        public void IsGrabbable_FalseByDefault()
        {
            Assert.IsFalse(holoScriptObject.isGrabbable);
        }
    }
}
