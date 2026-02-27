/**
 * Twitter Targets Page
 * 
 * Manage parsing targets (keywords and accounts)
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TargetsTab } from '@/components/twitter/TargetsTab';

export default function TwitterTargetsPage() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard/twitter')}
          className="mb-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Twitter Status
        </Button>
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Parsing Targets</h1>
          </div>
          <p className="text-gray-500">
            Configure keywords and accounts to track for crypto signals
          </p>
        </div>
        
        {/* Targets component */}
        <TargetsTab />
      </div>
    </div>
  );
}
