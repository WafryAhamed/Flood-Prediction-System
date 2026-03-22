import React, { useState } from 'react';
import { Plus, Edit2, Eye, EyeOff, Trash2, BookOpen } from 'lucide-react';
import { useAdminControlStore } from '../../../stores/adminControlStore';

export default function EducationTab() {
  const [editingGuideId, setEditingGuideId] = useState<string | null>(null);
  const [editingWisdom, setEditingWisdom] = useState(false);

  const learnGuides = useAdminControlStore((s) => s.learnGuides);
  const updateLearnGuide = useAdminControlStore((s) => s.updateLearnGuide);
  const learnTips = useAdminControlStore((s) => s.learnTips);
  const updateLearnTips = useAdminControlStore((s) => s.updateLearnTips);
  const featuredWisdom = useAdminControlStore((s) => s.featuredWisdom);
  const updateFeaturedWisdom = useAdminControlStore((s) => s.updateFeaturedWisdom);

  return (
    <div className="space-y-8">
      {/* Learn Guides Management */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <h3 className="text-sm font-bold uppercase text-blue-400 mb-6 flex items-center gap-2">
          <BookOpen size={18} /> Education Guides
        </h3>

        <div className="space-y-4">
          {learnGuides.map((guide) => (
            <div
              key={guide.id}
              className={`p-4 border rounded-lg transition-colors ${
                guide.visible
                  ? 'bg-blue-900/20 border-blue-600'
                  : 'bg-gray-900 border-gray-700 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  {editingGuideId === guide.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={guide.title}
                        placeholder="Guide title"
                        onChange={(e) =>
                          updateLearnGuide(guide.id, { title: e.target.value })
                        }
                        className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-blue-400"
                      />
                      <textarea
                        value={guide.description}
                        placeholder="Guide description"
                        onChange={(e) =>
                          updateLearnGuide(guide.id, { description: e.target.value })
                        }
                        className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-blue-400 resize-none"
                      />
                    </div>
                  ) : (
                    <>
                      <p className="font-bold text-white">{guide.title}</p>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {guide.description}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateLearnGuide(guide.id, { visible: !guide.visible })
                  }
                  className="flex-1 flex items-center justify-center gap-2 p-2 text-sm font-bold border border-gray-600 rounded hover:border-blue-400 transition-colors"
                >
                  {guide.visible ? (
                    <>
                      <Eye size={16} /> Visible
                    </>
                  ) : (
                    <>
                      <EyeOff size={16} /> Hidden
                    </>
                  )}
                </button>

                <button
                  onClick={() =>
                    setEditingGuideId(editingGuideId === guide.id ? null : guide.id)
                  }
                  className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <Edit2 size={16} />
                </button>

                <button className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Wisdom Management */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <h3 className="text-sm font-bold uppercase text-purple-400 mb-6">Featured Wisdom</h3>

        <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg space-y-3">
          {editingWisdom ? (
            <>
              <textarea
                value={featuredWisdom.quote}
                onChange={(e) =>
                  updateFeaturedWisdom({ quote: e.target.value })
                }
                className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-purple-400 resize-none h-24"
              />
              <input
                type="text"
                value={featuredWisdom.source}
                onChange={(e) =>
                  updateFeaturedWisdom({ source: e.target.value })
                }
                placeholder="Source attribution"
                className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-purple-400"
              />
            </>
          ) : (
            <>
              <p className="italic text-white leading-relaxed text-sm">
                {featuredWisdom.quote}
              </p>
              <p className="text-xs text-gray-400">{featuredWisdom.source}</p>
            </>
          )}

          <div className="flex gap-2">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-300 cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={featuredWisdom.visible}
                onChange={(e) =>
                  updateFeaturedWisdom({ visible: e.target.checked })
                }
                className="w-4 h-4 cursor-pointer"
              />
              Show on Learn Hub
            </label>

            <button
              onClick={() => setEditingWisdom(!editingWisdom)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded transition-colors flex items-center gap-2"
            >
              <Edit2 size={16} /> {editingWisdom ? 'Done' : 'Edit'}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-3 italic">
          Highlight traditional wisdom or expert advice. This prominent card appears at the top of the Learn Hub page.
        </p>
      </div>

      {/* Safety Tips Management */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <h3 className="text-sm font-bold uppercase text-green-400 mb-6">Safety Tips by Phase</h3>

        <div className="space-y-6">
          {learnTips.map((section) => (
            <div
              key={section.id}
              className="p-4 bg-gray-900 border border-gray-700 rounded-lg"
            >
              <h4 className="font-bold text-white mb-3">{section.title}</h4>

              <div className="space-y-2 mb-4">
                {section.tips.map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-green-400 font-bold shrink-0">•</span>
                    <input
                      type="text"
                      value={tip}
                      onChange={(e) => {
                        const newTips = [...section.tips];
                        newTips[idx] = e.target.value;
                        updateLearnTips(section.id, newTips);
                      }}
                      className="flex-1 bg-gray-800 border border-gray-600 text-white px-2 py-1 rounded text-sm focus:outline-none focus:border-green-400"
                    />
                  </div>
                ))}
              </div>

              <button className="w-full px-3 py-2 border border-gray-600 text-gray-300 hover:text-green-400 font-bold text-sm rounded transition-colors flex items-center justify-center gap-2">
                <Plus size={14} /> Add Tip
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tips Preview */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <h3 className="text-sm font-bold uppercase text-yellow-400 mb-4">How It Appears to Users</h3>

        <p className="text-xs text-gray-400 mb-4">
          Users see these tips organized in three columns by phase:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {learnTips.map((section) => (
            <div
              key={section.id}
              className="p-4 bg-gray-900 border border-gray-700 rounded-lg border-l-4 border-l-yellow-400"
            >
              <p className="font-bold text-white text-sm mb-3">{section.title}</p>
              <ul className="space-y-1 text-xs text-gray-400">
                {section.tips.slice(0, 3).map((tip, idx) => (
                  <li key={idx}>• {tip}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
