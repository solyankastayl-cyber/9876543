#!/usr/bin/env python3
"""
Fractal Multi-Asset Platform - Backend API Testing
Tests: Health, Brain v2, Stress Simulation, Cross-Asset, Engine Global
"""

import requests
import json
import sys
from datetime import datetime
import time

class FractalAPITester:
    def __init__(self, base_url="https://fractal-index-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def log_result(self, test_name, success, status_code, response_data, error=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": test_name,
            "success": success,
            "status_code": status_code,
            "timestamp": datetime.now().isoformat(),
            "error": error
        }
        
        # Add response summary for successful tests
        if success and response_data:
            if isinstance(response_data, dict):
                if 'ok' in response_data:
                    result['response_summary'] = {'ok': response_data['ok']}
                elif 'status' in response_data:
                    result['response_summary'] = {'status': response_data['status']}
                else:
                    # Get first few keys for summary
                    keys = list(response_data.keys())[:3]
                    result['response_summary'] = {k: str(response_data[k])[:100] for k in keys}
        
        self.results.append(result)
        
        # Print result
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name} (HTTP {status_code})")
        if error:
            print(f"    Error: {error}")
        elif success and 'response_summary' in result:
            print(f"    Response: {result['response_summary']}")
        print()

    def test_endpoint(self, name, method, endpoint, expected_status=200, data=None):
        """Test a single API endpoint"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}

        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = response.text

            self.log_result(name, success, response.status_code, response_data)
            return success, response_data

        except requests.exceptions.Timeout:
            self.log_result(name, False, 0, None, "Request timeout (30s)")
            return False, None
        except requests.exceptions.ConnectionError:
            self.log_result(name, False, 0, None, "Connection error")
            return False, None
        except Exception as e:
            self.log_result(name, False, 0, None, str(e))
            return False, None

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("=" * 70)
        print("  FRACTAL MULTI-ASSET PLATFORM - API TESTING")
        print("=" * 70)
        print(f"Backend URL: {self.base_url}")
        print(f"Test started: {datetime.now().isoformat()}")
        print()

        # Test 1: Health endpoint
        print("🔍 Testing Core Health...")
        self.test_endpoint("Health Check", "GET", "/api/health")

        # Test 2: Brain v2 Status  
        print("🔍 Testing Brain v2...")
        self.test_endpoint("Brain v2 Status", "GET", "/api/brain/v2/status")

        # Test 3: Stress Presets
        print("🔍 Testing Stress Simulation...")
        self.test_endpoint("Stress Presets", "GET", "/api/brain/v2/stress/presets")

        # Test 4: Stress Simulation - COVID_CRASH preset
        print("🔍 Testing Stress Simulation Run...")
        stress_payload = {
            "asset": "dxy",
            "start": "2020-01-01",
            "end": "2020-06-01",
            "stepDays": 7,
            "scenarioPreset": "COVID_CRASH"
        }
        self.test_endpoint("Stress Simulation Run", "POST", "/api/brain/v2/stress/run", 200, stress_payload)

        # Test 5: Cross-Asset Regime Classifier
        print("🔍 Testing Cross-Asset Regime...")
        self.test_endpoint("Cross-Asset Regime", "GET", "/api/brain/v2/cross-asset")

        # Test 6: Engine Global
        print("🔍 Testing Engine Global...")
        self.test_endpoint("Engine Global Allocations", "GET", "/api/engine/global")

        # Test 7: Platform Crash-Test (Optional - may be slow)
        print("🔍 Testing Platform Crash-Test (this may take time)...")
        crash_payload = {
            "start": "2024-01-01",
            "end": "2024-06-01", 
            "stepDays": 30,
            "asset": "dxy"
        }
        # Give crash test more time and allow it to fail without breaking test suite
        try:
            url = f"{self.base_url}/api/platform/crash-test/run"
            headers = {'Content-Type': 'application/json'}
            response = requests.post(url, json=crash_payload, headers=headers, timeout=60)
            
            success = response.status_code == 200
            try:
                response_data = response.json()
            except:
                response_data = response.text
            
            self.log_result("Platform Crash-Test", success, response.status_code, response_data)
        except requests.exceptions.Timeout:
            self.log_result("Platform Crash-Test", False, 0, None, "Timeout - test may be too intensive")
        except Exception as e:
            self.log_result("Platform Crash-Test", False, 0, None, f"Crash-test error: {str(e)}")

        # Additional brain endpoints for completeness
        print("🔍 Testing Additional Brain Endpoints...")
        self.test_endpoint("Brain Compare", "GET", "/api/brain/v2/compare")
        self.test_endpoint("Brain Features", "GET", "/api/brain/v2/features")

        # Print Summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("=" * 70)
        print("  TEST SUMMARY")
        print("=" * 70)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        print()

        # Show failed tests
        failed_tests = [r for r in self.results if not r['success']]
        if failed_tests:
            print("❌ FAILED TESTS:")
            for test in failed_tests:
                error_msg = test['error'] or f"HTTP {test['status_code']}"
                print(f"  - {test['test']}: {error_msg}")
            print()

        # Save detailed results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = f"/app/test_reports/backend_test_results_{timestamp}.json"
        
        with open(results_file, 'w') as f:
            json.dump({
                'summary': {
                    'tests_run': self.tests_run,
                    'tests_passed': self.tests_passed,
                    'success_rate': (self.tests_passed/self.tests_run*100) if self.tests_run > 0 else 0,
                    'timestamp': datetime.now().isoformat(),
                    'backend_url': self.base_url
                },
                'results': self.results
            }, f, indent=2)
        
        print(f"📄 Detailed results saved: {results_file}")
        return self.tests_passed == self.tests_run

def main():
    tester = FractalAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())