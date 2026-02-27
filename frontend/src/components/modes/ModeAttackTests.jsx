/**
 * Phase 6: Mode Attack Tests Panel
 * Run and display Phase 6 attack test results
 */
import { useState } from 'react';
import { Shield, Play, Loader2, CheckCircle, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { runModeAttackTests } from '../../api/mlModes.api';

const TEST_TOOLTIPS = {
  F1: 'Attempts to enable ASSIST mode when gates are failing. Should be blocked.',
  F2: 'Simulates flip rate exceeding 7% threshold. Should trigger auto-disable.',
  F3: 'Simulates ECE exceeding 0.15 threshold. Should trigger auto-disable.',
  F4: 'Attempts to move items across bucket boundaries. Should be architecturally impossible.',
  F5: 'Triggers Kill Switch multiple times rapidly. Should remain idempotent.',
  F6: 'Manual mode switch to OFF. Should be immediate with no delay.',
  F7: 'ADVISOR mode without active calibration map. Should fallback to raw confidence.',
};

export function ModeAttackTests() {
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  const handleRunTests = async () => {
    setError(null);
    setRunning(true);
    try {
      const data = await runModeAttackTests();
      if (data.success) {
        setResults(data);
      } else {
        setError(data.error || 'Tests failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to run tests');
    } finally {
      setRunning(false);
    }
  };

  const allPassed = results?.failed === 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-indigo-500" />
        <h3 className="text-lg font-semibold text-gray-900">Attack Tests</h3>
        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded font-medium">
          Phase 6
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-gray-900 text-white border-gray-700">
              <p className="text-sm">Automated security tests that verify ML Modes and Kill Switch work correctly under adversarial conditions.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Security tests to verify ML Modes and Kill Switch robustness.
      </p>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleRunTests}
              disabled={running}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="run-mode-attack-tests-btn"
            >
              {running ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Running tests...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Run Attack Tests (Phase 6)
                </>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-900 text-white border-gray-700">
            <p className="text-sm">Execute all 7 Phase 6 attack tests. Takes about 5-10 seconds.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        </div>
      )}

      {results && (
        <div className="mt-4 space-y-3">
          {/* Summary */}
          <div className={`p-4 rounded-lg border ${
            allPassed
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className={`flex items-center gap-2 text-lg font-medium ${
              allPassed ? 'text-green-700' : 'text-red-700'
            }`}>
              {allPassed ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
              {allPassed ? 'All tests passed' : 'Some tests failed'}
            </div>
            <div className="mt-1 text-sm text-gray-600">
              Passed: {results.passed} / {results.totalTests}
            </div>
          </div>

          {/* Individual Tests */}
          <div className="space-y-2">
            {results.results?.map((test, idx) => (
              <TooltipProvider key={test.id || idx}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`p-3 rounded-lg border cursor-help ${
                        test.passed
                          ? 'bg-green-50 border-green-100'
                          : 'bg-red-50 border-red-100'
                      }`}
                      data-testid={`mode-attack-test-result-${idx}`}
                    >
                      <div className="flex items-center gap-2">
                        {test.passed ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`font-medium text-sm ${
                          test.passed ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {test.id}: {test.name}
                        </span>
                        <span className="text-xs text-gray-500 ml-auto">
                          {test.category}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-600 pl-6">
                        {test.details}
                      </p>
                      <p className="text-xs text-gray-500 pl-6 mt-0.5">
                        Expected: {test.expected} | Actual: {test.actual}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm bg-gray-900 text-white border-gray-700">
                    <p className="text-sm">{TEST_TOOLTIPS[test.id] || 'Attack test for system safety verification'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ModeAttackTests;
