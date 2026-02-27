import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const DoNotFollowIf = ({ doNotFollowIf }) => {
  if (!doNotFollowIf || doNotFollowIf.length === 0) return null;

  return (
    <div className="bg-white border border-red-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <h2 className="text-lg font-bold text-gray-900">Do NOT Follow If</h2>
      </div>
      <div className="space-y-2">
        {doNotFollowIf.map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-red-50 rounded-xl">
            <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-gray-900">{item.condition}</span>
              <span className="text-gray-500"> — </span>
              <span className="text-gray-600">{item.reason}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoNotFollowIf;
