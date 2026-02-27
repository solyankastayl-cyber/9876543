/**
 * Backer Project Impact Table
 * 
 * Shows all projects with role and impact.
 */
import { Link } from 'react-router-dom';
import { Star, ExternalLink } from 'lucide-react';

const RoleBadge = ({ role, isAnchor }) => {
  const colors = {
    ANCHOR: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    LEAD: 'bg-purple-100 text-purple-700 border-purple-300',
    CO_INVEST: 'bg-blue-100 text-blue-700 border-blue-300',
    FOLLOW_ON: 'bg-gray-100 text-gray-600 border-gray-300',
    UNKNOWN: 'bg-gray-50 text-gray-500 border-gray-200',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colors[role] || colors.UNKNOWN}`}>
      {isAnchor && <Star className="w-3 h-3" />}
      {role}
    </span>
  );
};

const StageBadge = ({ stage }) => {
  const colors = {
    EARLY: 'bg-yellow-50 text-yellow-700',
    GROWTH: 'bg-blue-50 text-blue-700',
    MATURE: 'bg-green-50 text-green-700',
  };
  
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[stage] || 'bg-gray-50 text-gray-600'}`}>
      {stage}
    </span>
  );
};

export default function BackerProjectImpactTable({ impact }) {
  if (!impact || !impact.projects?.length) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400">
        No project impact data
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
          Project Impact
        </h3>
        <div className="text-xs text-gray-400">
          {impact.totalProjects} projects • {impact.anchorCount} anchors
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <th className="text-left py-3 px-6">Project</th>
              <th className="text-left py-3 px-4">Stage</th>
              <th className="text-left py-3 px-4">Role</th>
              <th className="text-center py-3 px-4">Authority</th>
              <th className="text-left py-3 px-4">Why</th>
              <th className="text-right py-3 px-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {impact.projects.map((project) => (
              <tr 
                key={project.projectId}
                className={`hover:bg-gray-50 ${project.isAnchor ? 'bg-yellow-50/30' : ''}`}
              >
                <td className="py-3 px-6">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">
                      {project.projectName}
                    </span>
                    {project.isAnchor && (
                      <Star className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {project.categories?.slice(0, 2).map(cat => (
                      <span key={cat} className="text-xs text-gray-400">{cat}</span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <StageBadge stage={project.stage} />
                </td>
                <td className="py-3 px-4">
                  <RoleBadge role={project.role} isAnchor={project.isAnchor} />
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-lg font-bold text-gray-800">
                    {project.authority}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {project.why}
                </td>
                <td className="py-3 px-6 text-right">
                  <Link
                    to={`/connections/projects/${project.projectSlug}`}
                    className="text-blue-500 hover:text-blue-600 text-sm inline-flex items-center gap-1"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
