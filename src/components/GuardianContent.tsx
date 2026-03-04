import React, { useState } from 'react';
import { AlertCircle, Search, Filter, Award } from 'lucide-react';
import { motion } from 'framer-motion';

interface GuardianTopic {
  id: string;
  title: string;
  category: 'preparation' | 'response' | 'recovery' | 'special-needs';
  emoji: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  badges: string[];
}

export function GuardianContent() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'preparation' | 'response' | 'recovery' | 'special-needs'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  const topics: GuardianTopic[] = [
    {
      id: '1',
      title: 'Eldercare During Floods',
      category: 'special-needs',
      emoji: '👴',
      description: 'Medications, mobility, nutrition for elderly during evacuation',
      duration: '12 min',
      difficulty: 'beginner',
      badges: ['Elderly', 'Medical', 'Mobility'],
    },
    {
      id: '2',
      title: 'Child Safety & Psychology',
      category: 'preparation',
      emoji: '👧',
      description: 'Preparing children, managing anxiety, evacuation kits',
      duration: '15 min',
      difficulty: 'intermediate',
      badges: ['Children', 'Psychology', 'Kit-Packing'],
    },
    {
      id: '3',
      title: 'Disabled Access During Crisis',
      category: 'response',
      emoji: '♿',
      description: 'Wheelchair-accessible routes, communication, assistance',
      duration: '18 min',
      difficulty: 'advanced',
      badges: ['Accessibility', 'Mobility', 'Support'],
    },
    {
      id: '4',
      title: 'Pet Evacuation Planning',
      category: 'preparation',
      emoji: '🐕',
      description: 'Pet carriers, veterinary records, animal shelters',
      duration: '10 min',
      difficulty: 'beginner',
      badges: ['Pets', 'Planning', 'Storage'],
    },
    {
      id: '5',
      title: 'Post-Flood Mental Health',
      category: 'recovery',
      emoji: '🧠',
      description: 'Processing trauma, family support, professional help',
      duration: '20 min',
      difficulty: 'intermediate',
      badges: ['Mental Health', 'Recovery', 'Support'],
    },
    {
      id: '6',
      title: 'Livelihood Recovery Guide',
      category: 'recovery',
      emoji: '📊',
      description: 'Farmer/shopkeeper/business recovery resources',
      duration: '25 min',
      difficulty: 'advanced',
      badges: ['Farmers', 'Business', 'Financial'],
    },
    {
      id: '7',
      title: 'Emergency Communication',
      category: 'response',
      emoji: '📱',
      description: 'Staying connected when networks down, backup methods',
      duration: '8 min',
      difficulty: 'beginner',
      badges: ['Communication', 'Technology', 'Planning'],
    },
    {
      id: '8',
      title: 'Document Protection',
      category: 'preparation',
      emoji: '📄',
      description: 'Waterproofing, backups, digital storage',
      duration: '12 min',
      difficulty: 'beginner',
      badges: ['Documents', 'Technology', 'Preparation'],
    },
  ];

  const filteredTopics = topics.filter((topic) => {
    const matchesCategory = selectedCategory === 'all' || topic.category === selectedCategory;
    const matchesSearch = topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const difficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700';
      case 'advanced':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-8 rounded-2xl">
        <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
          👨‍👩‍👧‍👦 Guardian Learning Hub
        </h2>
        <p className="text-purple-100">
          Expert guidance for protecting your family & community during floods
        </p>
      </div>

      {/* Search & Filter */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <Filter size={18} /> Filter
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'All Topics' },
            { id: 'preparation', label: '🛡️ Preparation' },
            { id: 'response', label: '🆘 Response' },
            { id: 'recovery', label: '🔧 Recovery' },
            { id: 'special-needs', label: '🤝 Special Needs' },
          ].map((cat) => (
            <motion.button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as 'preparation' | 'response' | 'recovery')}
              className={`flex-shrink-0 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
              whileHover={{ scale: 1.05 }}
            >
              {cat.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTopics.map((topic, idx) => (
          <motion.div
            key={topic.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer hover:border-purple-400 group"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-3xl">{topic.emoji}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded ${difficultyColor(topic.difficulty)}`}>
                {topic.difficulty.charAt(0).toUpperCase() + topic.difficulty.slice(1)}
              </span>
            </div>

            <h3 className="text-lg font-bold mb-2 group-hover:text-purple-600 transition-colors">
              {topic.title}
            </h3>

            <p className="text-sm text-gray-600 mb-4">{topic.description}</p>

            <div className="flex flex-wrap gap-1 mb-4">
              {topic.badges.map((badge) => (
                <span key={badge} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                  {badge}
                </span>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <span className="text-xs text-gray-500">⏱️ {topic.duration}</span>
              <button className="text-purple-600 hover:text-purple-700 font-semibold text-sm">
                Start →
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredTopics.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 font-semibold">No topics found</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}
            className="mt-3 text-purple-600 hover:text-purple-700 font-semibold"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Resources Section */}
      <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          📚 Additional Resources
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              emoji: '🏥',
              title: 'Medical Support',
              desc: 'Healthcare during emergencies',
            },
            {
              emoji: '💵',
              title: 'Financial Recovery',
              desc: 'Relief funds & insurance claims',
            },
            {
              emoji: '🤝',
              title: 'Community Support',
              desc: 'Local help & volunteering',
            },
          ].map((resource) => (
            <button
              key={resource.title}
              className="p-4 bg-white rounded-lg hover:shadow-md transition-all text-left border border-purple-200 hover:border-purple-400"
            >
              <p className="text-2xl mb-2">{resource.emoji}</p>
              <p className="font-semibold text-gray-900">{resource.title}</p>
              <p className="text-xs text-gray-600">{resource.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Completion Badges */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Award size={20} /> Your Learning Progress
        </h3>
        <div className="grid grid-cols-3 gap-4 md:gap-6 text-center">
          {[
            { count: 3, label: 'Completed', emoji: '✅' },
            { count: 5, label: 'In Progress', emoji: '🔄' },
            { count: 8, label: 'Available', emoji: '🎯' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-bold text-yellow-700">{stat.count}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
