#!/usr/bin/env python3
"""
Simple test script to verify the form controls are working
"""

import requests
import time

def test_shiny_app():
    """Test if the Shiny app is responding correctly"""
    try:
        # Test if the app is running
        response = requests.get("http://localhost:7861", timeout=5)
        if response.status_code == 200:
            print("✅ App is running successfully!")
            print("✅ Form should be accessible at: http://localhost:7861")
            
            # Check if the page contains the textarea
            if 'question' in response.text and 'textarea' in response.text.lower():
                print("✅ Textarea element found in the page")
            else:
                print("⚠️ Textarea element not found in the page")
                
            return True
        else:
            print(f"❌ App returned status code: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to the app. Make sure it's running on port 7861")
        return False
    except Exception as e:
        print(f"❌ Error testing app: {e}")
        return False

if __name__ == "__main__":
    print("Testing Shiny form controls...")
    test_shiny_app()