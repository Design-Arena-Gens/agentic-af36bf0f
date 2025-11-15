'use client'

import { useState, useEffect, useRef } from 'react'
import { Clock, Plus, Trash2, CheckCircle2, Circle, Bell, BellOff, Mic, Volume2 } from 'lucide-react'
import { format } from 'date-fns'

interface Task {
  id: string
  title: string
  time: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  reminderSent: boolean
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState('')
  const [newTime, setNewTime] = useState('')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [notifications, setNotifications] = useState<string[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [voiceActive, setVoiceActive] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks')
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks))
    }

    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    const checkTasks = () => {
      const now = new Date()
      const currentTimeStr = format(now, 'HH:mm')

      tasks.forEach((task) => {
        if (!task.completed && !task.reminderSent && task.time <= currentTimeStr) {
          sendReminder(task)
        }
      })
    }

    const interval = setInterval(checkTasks, 30000) // Check every 30 seconds
    checkTasks() // Check immediately

    return () => clearInterval(interval)
  }, [tasks])

  const sendReminder = (task: Task) => {
    const message = `⚠️ Reminder: "${task.title}" - Task time has passed!`
    setNotifications(prev => [...prev, message])

    if (soundEnabled) {
      playNotificationSound()
    }

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        `Attention! You have an incomplete task: ${task.title}. Please complete it now.`
      )
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0
      window.speechSynthesis.speak(utterance)
    }

    setTasks(prev =>
      prev.map(t => (t.id === task.id ? { ...t, reminderSent: true } : t))
    )

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n !== message))
    }, 5000)
  }

  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }

  const addTask = () => {
    if (newTask.trim() && newTime) {
      const task: Task = {
        id: Date.now().toString(),
        title: newTask,
        time: newTime,
        completed: false,
        priority,
        reminderSent: false,
      }
      setTasks([...tasks, task])
      setNewTask('')
      setNewTime('')
      setPriority('medium')
    }
  }

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed, reminderSent: false } : task
    ))
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id))
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-500/10'
      case 'medium': return 'border-yellow-500 bg-yellow-500/10'
      case 'low': return 'border-green-500 bg-green-500/10'
      default: return 'border-blue-500 bg-blue-500/10'
    }
  }

  const incompleteTasks = tasks.filter(t => !t.completed)
  const completedTasks = tasks.filter(t => t.completed)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center pulse-glow">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              AI Assistant
            </h1>
          </div>
          <p className="text-gray-300 text-lg">Your personal routine manager</p>
        </div>

        {/* Current Time */}
        <div className="glass rounded-2xl p-6 mb-6 text-center">
          <Clock className="w-8 h-8 mx-auto mb-2 text-blue-400" />
          <div className="text-3xl md:text-4xl font-bold text-white">
            {format(currentTime, 'HH:mm:ss')}
          </div>
          <div className="text-gray-400 mt-1">
            {format(currentTime, 'EEEE, MMMM dd, yyyy')}
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-2">
            {notifications.map((notif, index) => (
              <div
                key={index}
                className="glass rounded-xl p-4 border-2 border-red-500 bg-red-500/20 slide-in"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-red-400 animate-bounce" />
                  <p className="text-white font-medium">{notif}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Task Form */}
        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Add New Task</h2>
          <div className="space-y-4">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              placeholder="Task description..."
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low" className="bg-gray-800">Low Priority</option>
                <option value="medium" className="bg-gray-800">Medium Priority</option>
                <option value="high" className="bg-gray-800">High Priority</option>
              </select>
              <button
                onClick={addTask}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-6 py-3 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Task
              </button>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="glass rounded-2xl p-4 mb-6 flex items-center justify-between">
          <span className="text-white font-medium">Sound Notifications</span>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              soundEnabled ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </button>
        </div>

        {/* Incomplete Tasks */}
        {incompleteTasks.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Pending Tasks ({incompleteTasks.length})
            </h2>
            <div className="space-y-3">
              {incompleteTasks.map((task) => (
                <div
                  key={task.id}
                  className={`glass rounded-xl p-4 border-l-4 ${getPriorityColor(task.priority)} slide-in`}
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="flex-shrink-0"
                    >
                      <Circle className="w-6 h-6 text-gray-400 hover:text-blue-400 transition-colors" />
                    </button>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{task.title}</h3>
                      <p className="text-gray-400 text-sm">⏰ {task.time}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {task.priority}
                    </span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="flex-shrink-0 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Completed Tasks ({completedTasks.length})
            </h2>
            <div className="space-y-3">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="glass rounded-xl p-4 opacity-60"
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="flex-shrink-0"
                    >
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    </button>
                    <div className="flex-1">
                      <h3 className="text-white font-medium line-through">{task.title}</h3>
                      <p className="text-gray-400 text-sm">⏰ {task.time}</p>
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="flex-shrink-0 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Plus className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-gray-400 text-lg">No tasks yet. Add your first task above!</p>
          </div>
        )}
      </div>
    </div>
  )
}
