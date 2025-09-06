import React, { createContext, useContext, useState } from 'react'

const DashboardContext = createContext()

export const useDashboard = () => {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}

export const DashboardProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [breadcrumbs, setBreadcrumbs] = useState([])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  const updateBreadcrumbs = (newBreadcrumbs) => {
    setBreadcrumbs(newBreadcrumbs)
  }

  const value = {
    sidebarOpen,
    currentPage,
    breadcrumbs,
    toggleSidebar,
    closeSidebar,
    setCurrentPage,
    updateBreadcrumbs,
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
} 