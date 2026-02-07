"""
Pytest configuration for HoloScript tests.
"""

import sys
from pathlib import Path

# Add the package to the path for tests
package_path = Path(__file__).parent.parent
sys.path.insert(0, str(package_path))
