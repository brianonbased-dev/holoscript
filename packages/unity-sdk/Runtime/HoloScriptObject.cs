using UnityEngine;

namespace HoloScript.Runtime
{
    /// <summary>
    /// Runtime component representing a HoloScript object in Unity
    /// Bridges HoloScript traits to Unity components
    /// </summary>
    [AddComponentMenu("HoloScript/HoloScript Object")]
    [DisallowMultipleComponent]
    public class HoloScriptObject : MonoBehaviour
    {
        [Header("HoloScript Metadata")]
        [Tooltip("Original HoloScript object name")]
        public string objectName;

        [Tooltip("HoloScript traits applied to this object")]
        public string[] traits = new string[0];

        [Header("Material")]
        [Tooltip("HoloScript material preset")]
        public string materialPreset = "standard";

        [Header("Interaction")]
        [Tooltip("Is this object grabbable?")]
        public bool isGrabbable = false;

        [Tooltip("Is this object throwable?")]
        public bool isThrowable = false;

        [Header("State Management")]
        [Tooltip("HoloScript reactive state bindings")]
        public StateBinding[] stateBindings = new StateBinding[0];

        private void Start()
        {
            // Apply traits at runtime
            ApplyTraits();

            // Initialize state bindings
            InitializeStateBindings();
        }

        private void ApplyTraits()
        {
            foreach (string trait in traits)
            {
                ApplyTrait(trait);
            }
        }

        private void ApplyTrait(string trait)
        {
            switch (trait)
            {
                case "grabbable":
                    isGrabbable = true;
                    // Add XR Grab Interactable component if available
                    break;

                case "throwable":
                    isThrowable = true;
                    // Ensure Rigidbody exists
                    if (GetComponent<Rigidbody>() == null)
                    {
                        gameObject.AddComponent<Rigidbody>();
                    }
                    break;

                case "glowing":
                    // Add emission to material
                    Renderer renderer = GetComponent<Renderer>();
                    if (renderer != null && renderer.material != null)
                    {
                        renderer.material.EnableKeyword("_EMISSION");
                    }
                    break;

                // TODO: Add more trait handlers
            }
        }

        private void InitializeStateBindings()
        {
            // TODO: Set up reactive state system
        }

        /// <summary>
        /// Call a HoloScript method on this object
        /// </summary>
        public void CallMethod(string methodName, params object[] args)
        {
            // TODO: Invoke HoloScript method via runtime bridge
            Debug.Log($"[HoloScript] Calling method: {methodName}");
        }
    }

    /// <summary>
    /// Represents a HoloScript state binding (reactive property)
    /// </summary>
    [System.Serializable]
    public class StateBinding
    {
        public string propertyName;
        public string holoscriptExpression;
        public bool isTwoWay = false;
    }
}
