import React, { createContext, useContext, useState, useEffect } from 'react'

export type DataSource = 'postgres' | 'clickhouse' | 'duckdb'

interface DataSourceContextProps {
  dataSource: DataSource
  setDataSource: (source: DataSource) => void
}

const DataSourceContext = createContext<DataSourceContextProps | undefined>(
  undefined
)

export const DataSourceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [dataSource, setDataSourceState] = useState<DataSource>('postgres')
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by waiting for client-side mounting before reading localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pageview_data_source') as DataSource
    if (saved && ['postgres', 'clickhouse', 'duckdb'].includes(saved)) {
      setDataSourceState(saved)
    }
    setMounted(true)
  }, [])

  const setDataSource = (source: DataSource) => {
    setDataSourceState(source)
    localStorage.setItem('pageview_data_source', source)
  }

  // To prevent hydration warnings, we render children, but the context values are stable.
  return (
    <DataSourceContext.Provider value={{ dataSource, setDataSource }}>
      {children}
    </DataSourceContext.Provider>
  )
}

export const useDataSource = () => {
  const context = useContext(DataSourceContext)
  if (context === undefined) {
    throw new Error('useDataSource must be used within a DataSourceProvider')
  }
  return context
}
