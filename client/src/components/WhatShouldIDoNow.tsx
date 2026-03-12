import React, { useState } from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActionItem {
  id: string;
  action: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedTime: string;
  icon: string;
  description: string;
  completed: boolean;
}

interface WhatShouldIDoNowProps {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  userProfile?: {
    homeType?: string;
    livelihood?: string;
    hasElderly?: boolean;
    hasChildren?: boolean;
    hasDisabled?: boolean;
    familySize?: number;
  };
  time?: Date;
}

export function WhatShouldIDoNow({
  riskLevel,
  userProfile = {},

}: WhatShouldIDoNowProps) {
  const [actions, setActions] = useState<ActionItem[]>(generateActions(riskLevel, userProfile));
  const [checkedCount, setCheckedCount] = useState(0);

  function generateActions(risk: string, profile: Record<string, unknown>): ActionItem[] {
    const baseActions: ActionItem[] = [];
    const hour = new Date().getHours();

    // ALWAYS include
    baseActions.push(
      {
        id: '1',
        action: 'Charge your phone fully',
        priority: 'critical',
        estimatedTime: '10 min',
        icon: '🔋',
        description: 'Battery backup for emergencies',
        completed: false,
      },
      {
        id: '2',
        action: 'Inform family of your location',
        priority: 'critical',
        estimatedTime: '5 min',
        icon: '📱',
        description: 'Via SMS or WhatsApp (offline works)',
        completed: false,
      }
    );

    // Risk-specific actions
    if (risk === 'high' || risk === 'critical') {
      baseActions.push(
        {
          id: '3',
          action: 'Gather important documents',
          priority: 'high',
          estimatedTime: '15 min',
          icon: '📄',
          description: 'ID, insurance, deeds - in waterproof bag',
          completed: false,
        },
        {
          id: '4',
          action: 'Move valuables to higher ground',
          priority: 'high',
          estimatedTime: '20 min',
          icon: '📦',
          description: 'Electronics, jewelry, heirlooms',
          completed: false,
        },
        {
          id: '5',
          action: 'Check evacuation route',
          priority: 'high',
          estimatedTime: '5 min',
          icon: '🛣️',
          description: 'Know where to go if ordered to evacuate',
          completed: false,
        }
      );

      // Multi-floor evacuation
      if (profile.homeType === 'single-floor') {
        baseActions.push({
          id: '6',
          action: 'Prepare evacuation kit',
          priority: 'high',
          estimatedTime: '30 min',
          icon: '🎒',
          description: 'Food, water, first aid, medications',
          completed: false,
        });
      } else {
        baseActions.push({
          id: '6',
          action: 'Move to upper floors',
          priority: 'critical',
          estimatedTime: 'Immediate',
          icon: '⬆️',
          description: 'Away from flood water risk',
          completed: false,
        });
      }
    }

    // Family considerations
    if (profile.hasElderly) {
      baseActions.push({
        id: '7',
        action: 'Ensure elderly have medications',
        priority: 'high',
        estimatedTime: '10 min',
        icon: '💊',
        description: '3-day supply + prescription copies',
        completed: false,
      });
    }

    if (profile.hasChildren) {
      baseActions.push({
        id: '8',
        action: 'Prepare school bag for evacuation',
        priority: 'high',
        estimatedTime: '15 min',
        icon: '🎒',
        description: 'Clothes, snacks, comfort items',
        completed: false,
      });
    }

    if (profile.hasDisabled) {
      baseActions.push({
        id: '9',
        action: 'Ensure accessibility aids are charged',
        priority: 'high',
        estimatedTime: '10 min',
        icon: '♿',
        description: 'Wheelchairs, hearing aids, medical devices',
        completed: false,
      });
    }

    // Livelihood-specific
    if (profile.livelihood === 'farmer') {
      baseActions.push({
        id: '10',
        action: 'Move seeds & livestock to higher ground',
        priority: 'high',
        estimatedTime: '45 min',
        icon: '🌾',
        description: 'Critical livelihood assets',
        completed: false,
      });
    } else if (profile.livelihood === 'shopkeeper') {
      baseActions.push({
        id: '11',
        action: 'Secure business records',
        priority: 'high',
        estimatedTime: '30 min',
        icon: '🏪',
        description: 'Accounts, receipts, inventory lists',
        completed: false,
      });
    }

    // Time-specific (night)
    if (hour >= 20 || hour <= 5) {
      baseActions.push({
        id: '12',
        action: 'Prepare to evacuate at night',
        priority: 'critical',
        estimatedTime: '15 min',
        icon: '🌙',
        description: 'Flashlights, reflectors, safe shoes',
        completed: false,
      });
    }

    // Pets
    baseActions.push({
      id: '13',
      action: 'Prepare pet evacuation supplies',
      priority: 'medium',
      estimatedTime: '20 min',
      icon: '🐕',
      description: 'Carriers, food, medical records',
      completed: false,
    });

    // Weather monitoring
    baseActions.push({
      id: '14',
      action: 'Monitor weather updates',
      priority: 'medium',
      estimatedTime: 'Ongoing',
      icon: '☔',
      description: 'Check app alerts every 30 minutes',
      completed: false,
    });

    return baseActions;
  }

  const toggleAction = (id: string) => {
    const newActions = actions.map((a) =>
      a.id === id ? { ...a, completed: !a.completed } : a
    );
    setActions(newActions);
    setCheckedCount(newActions.filter((a) => a.completed).length);
  };

  const criticalActions = actions.filter((a) => a.priority === 'critical');
  const otherActions = actions.filter((a) => a.priority !== 'critical');
  const estimatedTotal = calculateTotalTime(actions);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header with Risk Level */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-t-2xl p-6 text-white text-center font-bold text-xl ${
          riskLevel === 'critical'
            ? 'bg-red-600'
            : riskLevel === 'high'
            ? 'bg-orange-600'
            : riskLevel === 'medium'
            ? 'bg-yellow-600'
            : 'bg-blue-600'
        }`}
      >
        {riskLevel === 'critical' && '🚨 IMMEDIATE ACTION REQUIRED'}
        {riskLevel === 'high' && '⚠️ URGENT - Prepare Now'}
        {riskLevel === 'medium' && '🟡 ALERT - Start Preparations'}
        {riskLevel === 'low' && '🟢 Stay Informed & Prepared'}
      </motion.div>

      {/* Progress Bar */}
      <div className="bg-white px-6 pt-6">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-gray-900">
              Progress: {checkedCount}/{actions.length}
            </span>
            <span className="text-sm text-gray-600">{estimatedTotal}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(checkedCount / actions.length) * 100}%` }}
              className="h-full bg-green-500 transition-all"
            />
          </div>
        </div>

        {/* Motivational Message */}
        {checkedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-green-50 border-l-4 border-green-600 rounded"
          >
            <p className="text-sm text-green-900 font-semibold">
              ✅ Great job! You've completed {checkedCount} action
              {checkedCount !== 1 ? 's' : ''}. You're taking the right steps.
            </p>
          </motion.div>
        )}
      </div>

      {/* Critical Actions (Always First) */}
      {criticalActions.length > 0 && (
        <div className="bg-red-50 border-t-4 border-red-600 px-6 py-4">
          <h3 className="font-black text-red-700 mb-3 flex items-center gap-2">
            <AlertCircle size={20} /> DO FIRST (Critical)
          </h3>
          <div className="space-y-2">
            {criticalActions.map((action, idx) => (
              <motion.label
                key={action.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-3 p-3 bg-white rounded-lg cursor-pointer hover:shadow-md transition-shadow"
              >
                <input
                  type="checkbox"
                  checked={action.completed}
                  onChange={() => toggleAction(action.id)}
                  className="w-6 h-6 mt-1 accent-red-600 flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{action.icon}</span>
                    <div>
                      <p className={`font-bold ${action.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {action.action}
                      </p>
                      <p className="text-xs text-gray-600">{action.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> {action.estimatedTime}
                    </span>
                  </div>
                </div>
              </motion.label>
            ))}
          </div>
        </div>
      )}

      {/* Other Actions */}
      {otherActions.length > 0 && (
        <div className="bg-white px-6 py-4 border-t border-gray-200">
          <h3 className="font-black text-gray-900 mb-3">Other Important Tasks</h3>
          <div className="space-y-2">
            {otherActions.map((action, idx) => (
              <motion.label
                key={action.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (criticalActions.length + idx) * 0.1 }}
                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  action.completed
                    ? 'bg-gray-50 border-2 border-gray-300'
                    : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={action.completed}
                  onChange={() => toggleAction(action.id)}
                  className={`w-5 h-5 mt-1 flex-shrink-0 accent-${
                    action.priority === 'high'
                      ? 'orange'
                      : action.priority === 'medium'
                      ? 'yellow'
                      : 'blue'
                  }-600`}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{action.icon}</span>
                    <div>
                      <p className={`font-bold ${action.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {action.action}
                      </p>
                      <p className="text-xs text-gray-600">{action.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> {action.estimatedTime}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-semibold text-white ${
                      action.priority === 'high'
                        ? 'bg-orange-500'
                        : action.priority === 'medium'
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                    }`}>
                      {action.priority}
                    </span>
                  </div>
                </div>
              </motion.label>
            ))}
          </div>
        </div>
      )}

      {/* Completion Message */}
      {checkedCount === actions.length && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-6 border-t-4 border-green-600 text-center rounded-b-2xl"
        >
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="font-black text-green-900 text-lg mb-2">All Set!</h3>
          <p className="text-green-800 mb-4">
            You've completed all preparation steps. Stay alert and follow official updates.
          </p>
          <button className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors">
            📱 Enable Push Notifications
          </button>
        </motion.div>
      )}

      {/* Emergency Button Bar */}
      <div className="bg-red-600 px-6 py-4 text-white rounded-b-2xl flex gap-3">
        <button className="flex-1 py-2 bg-red-700 hover:bg-red-800 font-bold rounded transition-colors text-sm flex items-center justify-center gap-2">
          <strong>🚨 DMC</strong> 1999
        </button>
        <button className="flex-1 py-2 bg-red-700 hover:bg-red-800 font-bold rounded transition-colors text-sm flex items-center justify-center gap-2">
          <strong>🚨 Police</strong> 119
        </button>
      </div>
    </div>
  );
}

function calculateTotalTime(actions: ActionItem[]): string {
  const timeMap: Record<string, number> = {
    'Immediate': 0,
    '5 min': 5,
    '10 min': 10,
    '15 min': 15,
    '20 min': 20,
    '30 min': 30,
    '45 min': 45,
  };

  let total = 0;
  actions.forEach((a) => {
    if (a.estimatedTime !== 'Ongoing') {
      for (const [key, val] of Object.entries(timeMap)) {
        if (a.estimatedTime.includes(key)) {
          total += val;
          break;
        }
      }
    }
  });

  if (total === 0) return 'Quick';
  if (total <= 15) return '~15 minutes';
  if (total <= 30) return '~30 minutes';
  if (total <= 60) return '~1 hour';
  return `~${Math.ceil(total / 30) * 30} minutes`;
}
