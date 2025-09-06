import React, { createContext, useContext, useState } from 'react'

const NotificationContext = createContext()

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  const addNotification = (type, message, duration = 10000) => {
    const id = `${Date.now()}-${Math.random()}`
    setNotifications((prev) => [...prev, { id, type, message }])

    if (duration) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const success = (message, duration) => {
    return addNotification('success', message)
  }

  const error = (message, duration) => {
    return addNotification('error', message)
  }

  const warning = (message, duration) => {
    return addNotification('warning', message)
  }

  const info = (message, duration) => {
    return addNotification('info', message)
  }

  const value = {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info,
    showNotification: addNotification,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
} 