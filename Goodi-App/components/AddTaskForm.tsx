import React, { useState, useEffect } from 'react';
import { Task } from '../types';

interface AddTaskFormProps {
  onAddTask: (text: string, points: number, category: Task['category'], isSpecial: boolean) => void;
  isLocked: boolean;
}

const AddTaskForm: React.FC<AddTaskFormProps> = ({ onAddTask, isLocked }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPoints, setNewTaskPoints] = useState(1);
  const [newTaskCategory, setNewTaskCategory] = useState<Task['category']>('學習');
  const [isSpecial, setIsSpecial] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (isSpecial) {
      if (newTaskPoints < 5) {
        setNewTaskPoints(5);
      }
    } else {
      if (newTaskPoints > 3) {
        setNewTaskPoints(3);
      }
    }
  }, [isSpecial, newTaskPoints]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim() && !isLocked) {
      onAddTask(newTaskText.trim(), newTaskPoints, newTaskCategory, isSpecial);
      setNewTaskText('');
      setNewTaskPoints(1);
      setIsSpecial(false);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };
  
  if (isLocked) {
    return (
      <div className="mt-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md shadow">
          <p className="font-bold">升級以新增任務</p>
          <p className="text-sm">升級到「小幫手版」或「全功能版」即可為孩子自訂專屬任務喔！</p>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-white/60 backdrop-blur-md rounded-xl shadow-md p-4 border border-white/50">
      <h3 className="font-bold text-lg mb-2 text-gray-700">為孩子新增任務</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="例如：自己整理書包"
          className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:bg-white transition-colors placeholder-gray-500 text-gray-900"
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="text-gray-600 mr-2 text-sm font-medium">類別</label>
            <select
              id="category"
              value={newTaskCategory}
              onChange={(e) => setNewTaskCategory(e.target.value as Task['category'])}
              className="w-full mt-1 px-3 py-2 border border-gray-300 bg-white rounded-lg focus:bg-white text-gray-900"
            >
              <option value="學習">學習</option>
              <option value="家務">家務</option>
              <option value="生活">生活</option>
            </select>
          </div>
          <div>
             <label htmlFor="points" className="text-gray-600 mr-2 text-sm font-medium">點數</label>
            <input
              type="number"
              id="points"
              value={newTaskPoints}
              onChange={(e) => setNewTaskPoints(Number(e.target.value))}
              min={isSpecial ? 5 : 1}
              max={isSpecial ? 100 : 3}
              step="1"
              className="w-full mt-1 px-3 py-2 border border-gray-300 bg-white rounded-lg focus:bg-white text-gray-900"
            />
          </div>
        </div>
         <div className="flex items-center">
            <input
                type="checkbox"
                id="specialTask"
                checked={isSpecial}
                onChange={(e) => setIsSpecial(e.target.checked)}
                className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 bg-white"
            />
            <label htmlFor="specialTask" className="ml-2 block text-sm text-gray-