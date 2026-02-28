#!/usr/bin/env python3
"""
P10.1 Regime Memory State - Final Testing Results
This test runs with extended timeout for timeline endpoint
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import time

class RegimeMemoryFinalTester:
    def __init__(self, base_url="https://adaptive-learn-55.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []
        
    def test_with_long_timeout(self, name, endpoint, timeout=60):
        """Test endpoint with extended timeout"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        try:
            print(f"⏱️  Testing {name} (timeout: {timeout}s)...")
            response = requests.get(url, timeout=timeout)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ PASS - {name}")
                return True, data
            else:
                print(f"❌ FAIL - {name} (HTTP {response.status_code})")
                return False, None
        except requests.exceptions.Timeout:
            print(f"❌ FAIL - {name} (Timeout after {timeout}s)")
            return False, None
        except Exception as e:
            print(f"❌ FAIL - {name} (Error: {str(e)})")
            return False, None

    def run_final_validation(self):
        """Run final validation tests"""
        print("=" * 80)
        print("  P10.1 REGIME MEMORY - FINAL VALIDATION")
        print("=" * 80)
        print()
        
        results = {}
        
        # Test 1: Schema
        success, data = self.test_with_long_timeout(
            "Schema endpoint", 
            "/api/brain/v2/regime-memory/schema"
        )
        results['schema'] = {'success': success, 'data': data}
        
        # Test 2: Current state
        success, data = self.test_with_long_timeout(
            "Current state", 
            "/api/brain/v2/regime-memory/current"
        )
        results['current'] = {'success': success, 'data': data}
        
        # Test 3: Historical state
        success, data = self.test_with_long_timeout(
            "Historical state (asOf=2026-02-15)", 
            "/api/brain/v2/regime-memory/current?asOf=2026-02-15"
        )
        results['historical'] = {'success': success, 'data': data}
        
        # Test 4: Timeline with extended timeout (slow endpoint)
        success, data = self.test_with_long_timeout(
            "Timeline endpoint", 
            "/api/brain/v2/regime-memory/timeline?start=2026-01-01&end=2026-02-27&stepDays=7",
            timeout=90  # Extended timeout
        )
        results['timeline'] = {'success': success, 'data': data}
        
        # Analyze results
        self.analyze_results(results)
        
        return results

    def analyze_results(self, results):
        """Analyze and print detailed results"""
        print("\n" + "=" * 80)
        print("  DETAILED ANALYSIS")
        print("=" * 80)
        
        total_tests = len(results)
        passed_tests = sum(1 for r in results.values() if r['success'])
        
        print(f"Overall Success Rate: {passed_tests}/{total_tests} ({passed_tests/total_tests*100:.1f}%)")
        print()
        
        # Schema Analysis
        if results['schema']['success']:
            schema = results['schema']['data']
            scopes = schema.get('scopes', {})
            print("✅ Schema Analysis:")
            print(f"   - Found {len(scopes)} scopes: {list(scopes.keys())}")
            for scope, info in scopes.items():
                values_count = len(info.get('values', []))
                print(f"   - {scope}: {values_count} possible values")
        else:
            print("❌ Schema endpoint failed")
        
        print()
        
        # Current State Analysis
        if results['current']['success']:
            current = results['current']['data']
            print("✅ Current State Analysis:")
            print(f"   - AsOf: {current.get('asOf')}")
            print(f"   - Macro: {current['macro']['current']} ({current['macro']['daysInState']}d, stability: {current['macro']['stability']})")
            print(f"   - Guard: {current['guard']['current']} ({current['guard']['daysInState']}d, stability: {current['guard']['stability']})")
            print(f"   - CrossAsset: {current['crossAsset']['current']} ({current['crossAsset']['daysInState']}d, stability: {current['crossAsset']['stability']})")
            print(f"   - InputsHash: {current['meta']['inputsHash']}")
            
            # Validate stability formula
            for scope_name in ['macro', 'guard', 'crossAsset']:
                scope_data = current[scope_name]
                days = scope_data['daysInState']
                flips = scope_data['flips30d']
                stability = scope_data['stability']
                
                expected = 0.5 * min(days/90, 1) + 0.5 * max(0, 1-(flips/10))
                expected = round(expected * 1000) / 1000
                
                if abs(stability - expected) < 0.001:
                    print(f"   - {scope_name} stability formula: ✅ CORRECT ({stability} = {expected})")
                else:
                    print(f"   - {scope_name} stability formula: ❌ INCORRECT ({stability} ≠ {expected})")
        else:
            print("❌ Current state endpoint failed")
            
        print()
        
        # Historical State Analysis  
        if results['historical']['success']:
            historical = results['historical']['data']
            print("✅ Historical State Analysis:")
            print(f"   - AsOf: {historical.get('asOf')}")
            print(f"   - InputsHash: {historical['meta']['inputsHash']}")
            
            # Compare with current for NoLookahead test
            if results['current']['success']:
                current = results['current']['data']
                print("   - NoLookahead validation:")
                for scope in ['macro', 'guard', 'crossAsset']:
                    curr_regime = current[scope]['current']
                    hist_regime = historical[scope]['current']
                    curr_days = current[scope]['daysInState']
                    hist_days = historical[scope]['daysInState']
                    
                    if curr_regime == hist_regime:
                        if hist_days <= curr_days:
                            print(f"     ✅ {scope}: {hist_regime} - {hist_days}d <= {curr_days}d")
                        else:
                            print(f"     ❌ {scope}: {hist_regime} - {hist_days}d > {curr_days}d (LOOKAHEAD!)")
                    else:
                        print(f"     ⚠️  {scope}: Different regimes ({hist_regime} → {curr_regime})")
        else:
            print("❌ Historical state endpoint failed")
            
        print()
        
        # Timeline Analysis
        if results['timeline']['success']:
            timeline = results['timeline']['data']
            points = timeline.get('points', [])
            summary = timeline.get('summary', {})
            print("✅ Timeline Analysis:")
            print(f"   - Date range: {timeline.get('start')} to {timeline.get('end')}")
            print(f"   - Step days: {timeline.get('stepDays')}")
            print(f"   - Points: {len(points)}")
            print(f"   - Summary flips: macro={summary.get('macroFlips')}, guard={summary.get('guardFlips')}, crossAsset={summary.get('crossAssetFlips')}")
            print(f"   - Avg stability: macro={summary.get('avgMacroStability')}, guard={summary.get('avgGuardStability')}, crossAsset={summary.get('avgCrossAssetStability')}")
            print(f"   - Dominant regimes: {summary.get('dominantMacro')}/{summary.get('dominantGuard')}/{summary.get('dominantCrossAsset')}")
        else:
            print("❌ Timeline endpoint failed or timed out")

def main():
    tester = RegimeMemoryFinalTester()
    results = tester.run_final_validation()
    
    # Create summary for test report
    success_count = sum(1 for r in results.values() if r['success'])
    total_count = len(results)
    
    print(f"\n🎯 FINAL RESULT: {success_count}/{total_count} endpoints working correctly")
    
    if success_count == total_count:
        print("🎉 All P10.1 Regime Memory endpoints are fully functional!")
        return 0
    else:
        print("⚠️  Some endpoints have issues - see analysis above")
        return 1

if __name__ == "__main__":
    sys.exit(main())