import React, { useState } from 'react';
import { Plus, Share2, Phone, Heart, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FamilyMember {
  id: string;
  name: string;
  phone: string;
  location?: string;
  riskZone?: string;
  status: 'safe' | 'at-risk' | 'unknown' | 'evacuated';
  lastUpdate?: Date;
  relationship: string;
}

interface EmergencyShare {
  id: string;
  timestamp: Date;
  status: 'safe' | 'at-risk' | 'evacuating';
  location: string;
  message: string;
}

interface FamilySafetyToolsProps {
  familyMembers?: FamilyMember[];
  onMembersChange?: (members: FamilyMember[]) => void;
}

export function FamilySafetyTools({ familyMembers: initialMembers = [], onMembersChange }: FamilySafetyToolsProps) {
  const [members, setMembers] = useState<FamilyMember[]>(initialMembers);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', phone: '', relationship: '' });
  const [showShareModal, setShowShareModal] = useState(false);
  const [emergencyShares, setEmergencyShares] = useState<EmergencyShare[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<'safe' | 'at-risk' | 'evacuating'>('safe');

  const addMember = () => {
    if (newMember.name && newMember.phone) {
      const member: FamilyMember = {
        id: Date.now().toString(),
        name: newMember.name,
        phone: newMember.phone,
        relationship: newMember.relationship,
        status: 'unknown',
      };
      const updatedMembers = [...members, member];
      setMembers(updatedMembers);
      onMembersChange?.(updatedMembers);
      setNewMember({ name: '', phone: '', relationship: '' });
      setShowAddForm(false);
    }
  };

  const removeMember = (id: string) => {
    const updatedMembers = members.filter((m) => m.id !== id);
    setMembers(updatedMembers);
    onMembersChange?.(updatedMembers);
  };

  const updateMemberStatus = (id: string, status: FamilyMember['status']) => {
    const updatedMembers = members.map((m) =>
      m.id === id ? { ...m, status, lastUpdate: new Date() } : m
    );
    setMembers(updatedMembers);
    onMembersChange?.(updatedMembers);
  };

  const shareEmergencyStatus = () => {
    const userLocation = 'Colombo District'; // Should be dynamic
    const share: EmergencyShare = {
      id: Date.now().toString(),
      timestamp: new Date(),
      status: selectedStatus,
      location: userLocation,
      message: `I am ${selectedStatus}. Location: ${userLocation}. Please check on me.`,
    };
    setEmergencyShares([share, ...emergencyShares.slice(0, 4)]);

    // In real app, this would send via SMS, WhatsApp, etc.
    alert(`Emergency share sent to all family members!\n\nMessage: "${share.message}"`);
  };

  const atRiskMembers = members.filter((m) => m.status === 'at-risk');
  const safeMembers = members.filter((m) => m.status === 'safe');
  const unknownMembers = members.filter((m) => m.status === 'unknown');

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-2xl">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          👨‍👩‍👧‍👦 Family Safety Network
        </h2>
        <p className="text-blue-100 text-sm">Keep track of your loved ones in real-time</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border-2 border-green-600 rounded-lg p-4 text-center"
        >
          <div className="text-2xl font-bold text-green-700">{safeMembers.length}</div>
          <p className="text-xs text-green-600">Safe ✓</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-red-50 border-2 border-red-600 rounded-lg p-4 text-center"
        >
          <div className="text-2xl font-bold text-red-700">{atRiskMembers.length}</div>
          <p className="text-xs text-red-600">At Risk ⚠️</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-50 border-2 border-gray-600 rounded-lg p-4 text-center"
        >
          <div className="text-2xl font-bold text-gray-700">{unknownMembers.length}</div>
          <p className="text-xs text-gray-600">Unknown ?</p>
        </motion.div>
      </div>

      {/* Emergency Share Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        onClick={() => setShowShareModal(true)}
        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-lg"
      >
        <Share2 size={22} /> Share My Status Now
      </motion.button>

      {/* Emergency Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4"
            >
              <h3 className="font-bold text-lg">🆘 Share Your Status</h3>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">Select your current status:</p>
                {[
                  { id: 'safe', label: '✅ I am SAFE', emoji: '🟢', color: 'green' },
                  { id: 'at-risk', label: '⚠️ I am AT RISK', emoji: '🟠', color: 'orange' },
                  {
                    id: 'evacuating',
                    label: '🚗 I am EVACUATING',
                    emoji: '🔴',
                    color: 'red',
                  },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedStatus(option.id as typeof selectedStatus)}
                    className={`w-full p-3 rounded-lg border-2 font-semibold transition-all ${
                      selectedStatus === option.id
                        ? `border-${option.color}-600 bg-${option.color}-50`
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {option.emoji} {option.label}
                  </button>
                ))}
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-700 font-semibold">
                  😊 Your message will be shared with {members.length} family member
                  {members.length !== 1 ? 's' : ''} via SMS & WhatsApp.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 py-2 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    shareEmergencyStatus();
                    setShowShareModal(false);
                  }}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Send to All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Family Members List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">Family Members ({members.length})</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            <Plus size={16} /> Add
          </button>
        </div>

        {/* Add Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 space-y-3"
            >
              <input
                type="text"
                placeholder="Name"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <input
                type="tel"
                placeholder="Phone number"
                value={newMember.phone}
                onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <select
                value={newMember.relationship}
                onChange={(e) => setNewMember({ ...newMember, relationship: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select relationship...</option>
                <option value="Spouse">👰 Spouse</option>
                <option value="Parent">👴 Parent</option>
                <option value="Child">👧 Child</option>
                <option value="Sibling">👦 Sibling</option>
                <option value="Friend">👥 Friend</option>
                <option value="Other">Other</option>
              </select>

              <div className="flex gap-2">
                <button
                  onClick={addMember}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Add Member
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Members Grid */}
        {members.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 font-semibold">No family members added yet</p>
            <p className="text-sm text-gray-500 mt-1">Add family members to track them during emergencies</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map((member, idx) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  member.status === 'safe'
                    ? 'border-green-500 bg-green-50'
                    : member.status === 'at-risk'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-gray-900">{member.name}</p>
                    <p className="text-xs text-gray-600">{member.relationship}</p>
                  </div>
                  <button
                    onClick={() => removeMember(member.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-2 mb-3">
                  <p className="text-sm flex items-center gap-2 text-gray-700">
                    <Phone size={14} /> {member.phone}
                  </p>
                  {member.lastUpdate && (
                    <p className="text-xs text-gray-600">
                      Last update: {member.lastUpdate.toLocaleTimeString()}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Mark their status:</p>
                  <div className="flex gap-2">
                    {[
                      { id: 'safe', emoji: '✅', color: 'green' },
                      { id: 'at-risk', emoji: '⚠️', color: 'orange' },
                      { id: 'unknown', emoji: '❓', color: 'gray' },
                    ].map((status) => (
                      <button
                        key={status.id}
                        onClick={() =>
                          updateMemberStatus(member.id, status.id as FamilyMember['status'])
                        }
                        className={`flex-1 py-1 rounded font-semibold text-sm transition-all ${
                          member.status === status.id
                            ? `bg-${status.color}-600 text-white`
                            : `border-2 border-${status.color}-300 text-${status.color}-700 hover:bg-${status.color}-50`
                        }`}
                      >
                        {status.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Community Layer Info */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
        <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
          <Heart size={18} /> Community Safety Layer
        </h4>
        <p className="text-sm text-blue-800 mb-3">
          Based on reports from your area:
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-blue-800">• 5 people near you marked themselves safe</span>
            <span className="text-green-600 font-bold">✓</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-blue-800">• 2 people flagged potential help needed</span>
            <span className="text-orange-600 font-bold">⚠️</span>
          </div>
        </div>
      </div>
    </div>
  );
}
