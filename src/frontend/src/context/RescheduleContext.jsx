import { createContext, useContext, useState } from 'react'
import RescheduleModal from '../components/RescheduleModal'

const RescheduleContext = createContext()

export function RescheduleProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    vesselId: null,
    vesselName: '',
  })

  const openReschedule = (vesselId, vesselName = '') => {
    setModalState({
      isOpen: true,
      vesselId,
      vesselName,
    })
  }

  const closeReschedule = () => {
    setModalState(prev => ({ ...prev, isOpen: false }))
  }

  const handleApplied = (result) => {
    // Dispatch custom event so any active page (e.g. OperationsPage, HomePage) can refresh its data
    window.dispatchEvent(new CustomEvent('portmind:schedule_updated', { detail: result }))
  }

  return (
    <RescheduleContext.Provider value={{ openReschedule, closeReschedule }}>
      {children}
      <RescheduleModal
        isOpen={modalState.isOpen}
        vesselId={modalState.vesselId}
        vesselName={modalState.vesselName}
        onClose={closeReschedule}
        onApplied={handleApplied}
      />
    </RescheduleContext.Provider>
  )
}

export function useReschedule() {
  const ctx = useContext(RescheduleContext)
  if (!ctx) {
    throw new Error('useReschedule must be used within a RescheduleProvider')
  }
  return ctx
}

export default RescheduleContext
