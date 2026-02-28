#!/usr/bin/env python3
"""
P10.1 Regime Memory State - Specialized Backend Testing
Tests: Schema, Current State, Historical State, Timeline, Determinism, NoLookahead, Stability
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import time
import hashlib

class RegimeMemoryTester:
    def __init__(self, base_url="https://adaptive-learn-55.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []
        
    def log_result(self, test_name, success, status_code, response_data, error=None, details=None):
        """Log test result with optional details"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": test_name,
            "success": success,
            "status_code": status_code,
            "timestamp": datetime.now().isoformat(),
            "error": error,
            "details": details
        }
        
        self.results.append(result)
        
        # Print result
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name} (HTTP {status_code})")
        if error:
            print(f"    Error: {error}")
        if details:
            print(f"    Details: {details}")
        print()

    def test_endpoint(self, name, method, endpoint, expected_status=200, data=None, validation_fn=None):
        """Test a single API endpoint with optional custom validation"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}

        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")

            # Check status code
            if response.status_code != expected_status:
                self.log_result(name, False, response.status_code, None, 
                              f"Expected {expected_status}, got {response.status_code}")
                return False, None

            try:
                response_data = response.json()
            except:
                response_data = response.text

            # Run custom validation if provided
            validation_error = None
            validation_details = None
            if validation_fn and response_data:
                try:
                    validation_result = validation_fn(response_data)
                    if isinstance(validation_result, tuple):
                        validation_success, validation_details = validation_result
                    else:
                        validation_success = validation_result
                    
                    if not validation_success:
                        validation_error = f"Validation failed: {validation_details}"
                except Exception as e:
                    validation_error = f"Validation error: {str(e)}"
                    validation_success = False

            success = response.status_code == expected_status and not validation_error
            self.log_result(name, success, response.status_code, response_data, 
                          validation_error, validation_details)
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

    def validate_schema(self, response_data):
        """Validate schema endpoint response"""
        if not response_data.get('ok'):
            return False, "Response not OK"
        
        scopes = response_data.get('scopes', {})
        required_scopes = ['macro', 'guard', 'crossAsset']
        
        for scope in required_scopes:
            if scope not in scopes:
                return False, f"Missing scope: {scope}"
                
        # Check if each scope has values
        for scope in required_scopes:
            if 'values' not in scopes[scope] or not scopes[scope]['values']:
                return False, f"Scope {scope} missing values"
                
        return True, f"Found {len(scopes)} scopes: {list(scopes.keys())}"

    def validate_current_state(self, response_data):
        """Validate current state response"""
        if not response_data.get('ok'):
            return False, "Response not OK"
            
        required_fields = ['asOf', 'macro', 'guard', 'crossAsset', 'meta']
        for field in required_fields:
            if field not in response_data:
                return False, f"Missing field: {field}"
                
        # Check each scope has required structure
        for scope in ['macro', 'guard', 'crossAsset']:
            scope_data = response_data[scope]
            scope_required = ['scope', 'current', 'since', 'daysInState', 'flips30d', 'stability']
            for req_field in scope_required:
                if req_field not in scope_data:
                    return False, f"Missing {scope}.{req_field}"
                    
        # Check meta has inputsHash
        if 'inputsHash' not in response_data['meta']:
            return False, "Missing meta.inputsHash"
            
        return True, f"Valid regime state for {response_data['asOf']}"

    def validate_timeline(self, response_data):
        """Validate timeline response"""
        if not response_data.get('ok'):
            return False, "Response not OK"
            
        required_fields = ['start', 'end', 'stepDays', 'points', 'summary']
        for field in required_fields:
            if field not in response_data:
                return False, f"Missing field: {field}"
                
        points = response_data.get('points', [])
        if not points:
            return False, "No timeline points returned"
            
        # Check first point structure
        first_point = points[0]
        point_required = ['asOf', 'macro', 'guard', 'crossAsset']
        for field in point_required:
            if field not in first_point:
                return False, f"Missing point field: {field}"
                
        summary = response_data.get('summary', {})
        summary_required = ['macroFlips', 'guardFlips', 'crossAssetFlips', 
                          'avgMacroStability', 'avgGuardStability', 'avgCrossAssetStability']
        for field in summary_required:
            if field not in summary:
                return False, f"Missing summary field: {field}"
                
        return True, f"Timeline with {len(points)} points from {response_data['start']} to {response_data['end']}"

    def validate_stability_formula(self, response_data):
        """Validate stability formula: 0.5*(days/90) + 0.5*(1-flips/10)"""
        if not response_data.get('ok'):
            return False, "Response not OK"
            
        for scope_name in ['macro', 'guard', 'crossAsset']:
            scope_data = response_data[scope_name]
            days = scope_data['daysInState']
            flips = scope_data['flips30d']
            stability = scope_data['stability']
            
            # Calculate expected stability
            duration_score = min(days / 90, 1)
            flip_score = max(0, 1 - (flips / 10))
            expected_stability = 0.5 * duration_score + 0.5 * flip_score
            expected_stability = round(expected_stability * 1000) / 1000  # 3 decimal places
            
            # Allow small floating point differences
            if abs(stability - expected_stability) > 0.001:
                return False, f"{scope_name} stability mismatch: got {stability}, expected {expected_stability} (days={days}, flips={flips})"
                
        return True, "Stability formula validation passed"

    def run_regime_memory_tests(self):
        """Run comprehensive P10.1 Regime Memory tests"""
        print("=" * 80)
        print("  P10.1 REGIME MEMORY STATE - SPECIALIZED TESTING")
        print("=" * 80)
        print(f"Backend URL: {self.base_url}")
        print(f"Test started: {datetime.now().isoformat()}")
        print()

        # Test 1: Schema endpoint - must return 3 scopes
        print("🔍 Testing Schema Endpoint...")
        self.test_endpoint(
            "Schema with 3 scopes", 
            "GET", 
            "/api/brain/v2/regime-memory/schema",
            200,
            validation_fn=self.validate_schema
        )

        # Test 2: Current state (without asOf)
        print("🔍 Testing Current State...")
        success, current_response = self.test_endpoint(
            "Current regime state", 
            "GET", 
            "/api/brain/v2/regime-memory/current",
            200,
            validation_fn=self.validate_current_state
        )

        # Test 3: Historical state (with asOf)
        print("🔍 Testing Historical State...")
        historical_date = "2026-02-15"
        success_hist, historical_response = self.test_endpoint(
            f"Historical state (asOf={historical_date})", 
            "GET", 
            f"/api/brain/v2/regime-memory/current?asOf={historical_date}",
            200,
            validation_fn=self.validate_current_state
        )

        # Test 4: Timeline endpoint
        print("🔍 Testing Timeline Endpoint...")
        timeline_params = "start=2026-01-01&end=2026-02-27&stepDays=7"
        self.test_endpoint(
            "Timeline with summary", 
            "GET", 
            f"/api/brain/v2/regime-memory/timeline?{timeline_params}",
            200,
            validation_fn=self.validate_timeline
        )

        # Test 5: Determinism test - same asOf should produce same inputsHash
        print("🔍 Testing Determinism...")
        if success and current_response and success_hist and historical_response:
            self.test_determinism(current_response, historical_response, historical_date)

        # Test 6: NoLookahead test - historical daysInState <= current daysInState  
        print("🔍 Testing NoLookahead Property...")
        if success and current_response and success_hist and historical_response:
            self.test_no_lookahead(current_response, historical_response, historical_date)

        # Test 7: Stability formula validation
        print("🔍 Testing Stability Formula...")
        if success and current_response:
            self.test_endpoint(
                "Stability formula validation", 
                "GET", 
                "/api/brain/v2/regime-memory/current",
                200,
                validation_fn=self.validate_stability_formula
            )

        # Test 8: Multiple calls to same asOf for consistency
        print("🔍 Testing Multiple Calls Consistency...")
        self.test_multiple_calls_consistency(historical_date)

        # Print Summary
        self.print_summary()

    def test_determinism(self, current_response, historical_response, historical_date):
        """Test determinism: same asOf should produce same inputsHash"""
        try:
            # Make another call to the same historical date
            url = f"{self.base_url}/api/brain/v2/regime-memory/current?asOf={historical_date}"
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                second_call = response.json()
                
                first_hash = historical_response['meta']['inputsHash']
                second_hash = second_call['meta']['inputsHash']
                
                if first_hash == second_hash:
                    self.log_result("Determinism Test", True, 200, None, None, 
                                  f"Same inputsHash for asOf={historical_date}: {first_hash}")
                else:
                    self.log_result("Determinism Test", False, 200, None, 
                                  f"Different inputsHash: {first_hash} vs {second_hash}")
            else:
                self.log_result("Determinism Test", False, response.status_code, None, 
                              "Failed to make second call for determinism test")
        except Exception as e:
            self.log_result("Determinism Test", False, 0, None, str(e))

    def test_no_lookahead(self, current_response, historical_response, historical_date):
        """Test NoLookahead: historical daysInState should be <= current daysInState"""
        try:
            current_date = current_response['asOf']
            
            # For same regime, historical daysInState should be <= current daysInState
            for scope in ['macro', 'guard', 'crossAsset']:
                current_regime = current_response[scope]['current']
                historical_regime = historical_response[scope]['current']
                
                current_days = current_response[scope]['daysInState']
                historical_days = historical_response[scope]['daysInState']
                
                # If same regime, historical days should be <= current days
                if current_regime == historical_regime:
                    if historical_days <= current_days:
                        details = f"{scope}: {historical_regime} - historical={historical_days}d <= current={current_days}d"
                    else:
                        self.log_result("NoLookahead Test", False, 200, None,
                                      f"{scope}: historical daysInState ({historical_days}) > current ({current_days})")
                        return
                        
            self.log_result("NoLookahead Test", True, 200, None, None, 
                          "Historical daysInState <= current daysInState for same regimes")
        except Exception as e:
            self.log_result("NoLookahead Test", False, 0, None, str(e))

    def test_multiple_calls_consistency(self, test_date):
        """Test that multiple calls to same asOf return consistent results"""
        try:
            url = f"{self.base_url}/api/brain/v2/regime-memory/current?asOf={test_date}"
            
            # Make 3 calls
            responses = []
            for i in range(3):
                response = requests.get(url, timeout=30)
                if response.status_code == 200:
                    responses.append(response.json())
                else:
                    self.log_result("Multiple Calls Consistency", False, response.status_code, None, 
                                  f"Call {i+1} failed")
                    return
                    
            # Compare all responses
            first_hash = responses[0]['meta']['inputsHash']
            all_same = all(r['meta']['inputsHash'] == first_hash for r in responses)
            
            if all_same:
                self.log_result("Multiple Calls Consistency", True, 200, None, None, 
                              f"All 3 calls returned same inputsHash: {first_hash}")
            else:
                hashes = [r['meta']['inputsHash'] for r in responses]
                self.log_result("Multiple Calls Consistency", False, 200, None,
                              f"Inconsistent hashes: {hashes}")
                              
        except Exception as e:
            self.log_result("Multiple Calls Consistency", False, 0, None, str(e))

    def print_summary(self):
        """Print test summary and save results"""
        print("=" * 80)
        print("  P10.1 REGIME MEMORY TEST SUMMARY")
        print("=" * 80)
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
                if test['details']:
                    print(f"    Details: {test['details']}")
            print()
        else:
            print("🎉 All tests passed!")
            print()

        # Save detailed results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = f"/app/test_reports/regime_memory_test_{timestamp}.json"
        
        with open(results_file, 'w') as f:
            json.dump({
                'summary': {
                    'module': 'P10.1 Regime Memory State',
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
    tester = RegimeMemoryTester()
    success = tester.run_regime_memory_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())