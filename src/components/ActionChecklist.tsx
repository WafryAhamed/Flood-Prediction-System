import React, { useState } from 'react';
import { CheckSquare, Square } from 'lucide-react';
interface ActionItem {
  id: string;
  text: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}
export function ActionChecklist() {
  const [actions, setActions] = useState<ActionItem[]>([{
    id: '1',
    text: 'Move valuable documents to high shelf',
    priority: 'high',
    completed: false
  }, {
    id: '2',
    text: 'Charge mobile phones & power banks',
    priority: 'high',
    completed: false
  }, {
    id: '3',
    text: 'Pack emergency bag (medicines, torch)',
    priority: 'medium',
    completed: false
  }, {
    id: '4',
    text: 'Check on elderly neighbors',
    priority: 'medium',
    completed: false
  }, {
    id: '5',
    text: 'Clear drains around house',
    priority: 'low',
    completed: false
  }]);
  const toggleAction = (id: string) => {
    setActions(actions.map(a => a.id === id ? {
      ...a,
      completed: !a.completed
    } : a));
  };
  const progress = Math.round(actions.filter(a => a.completed).length / actions.length * 100);
  return <div className="bg-white border-4 border-black p-0">
      <div className="bg-[#FFCC00] p-4 border-b-4 border-black flex justify-between items-center">
        <h3 className="font-black uppercase text-xl">What To Do Now</h3>
        <span className="font-mono font-bold bg-black text-white px-2 py-1 text-sm">
          {progress}% DONE
        </span>
      </div>

      <div className="divide-y-2 divide-gray-100">
        {actions.map(action => <button key={action.id} onClick={() => toggleAction(action.id)} className={`
              w-full p-4 flex items-start gap-4 text-left hover:bg-gray-50 transition-colors
              ${action.completed ? 'opacity-50' : 'opacity-100'}
            `}>
            {action.completed ? <CheckSquare size={24} className="text-[#00CC00] shrink-0" strokeWidth={3} /> : <Square size={24} className="text-black shrink-0" strokeWidth={3} />}
            <div>
              <p className={`font-bold text-lg leading-tight ${action.completed ? 'line-through' : ''}`}>
                {action.text}
              </p>
              {action.priority === 'high' && !action.completed && <span className="inline-block mt-1 text-[10px] font-black uppercase bg-[#FF0000] text-white px-1">
                  Critical
                </span>}
            </div>
          </button>)}
      </div>

      <div className="p-4 bg-gray-50 border-t-4 border-black">
        <button className="w-full bg-black text-white py-3 font-bold uppercase hover:bg-gray-800">
          Download Offline Guide
        </button>
      </div>
    </div>;
}