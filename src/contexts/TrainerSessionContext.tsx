import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

const STORAGE_KEY = 'panel:active-trainer-id'

interface TrainerSessionValue {
  activeTrainerId: string | null
  setActiveTrainerId: (id: string | null) => void
}

const TrainerSessionContext = createContext<TrainerSessionValue | undefined>(
  undefined,
)

export function TrainerSessionProvider({ children }: { children: ReactNode }) {
  const [activeTrainerId, setActiveTrainerIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY),
  )

  useEffect(() => {
    if (activeTrainerId) localStorage.setItem(STORAGE_KEY, activeTrainerId)
    else localStorage.removeItem(STORAGE_KEY)
  }, [activeTrainerId])

  return (
    <TrainerSessionContext.Provider
      value={{ activeTrainerId, setActiveTrainerId: setActiveTrainerIdState }}
    >
      {children}
    </TrainerSessionContext.Provider>
  )
}

export function useTrainerSession() {
  const ctx = useContext(TrainerSessionContext)
  if (!ctx)
    throw new Error(
      'useTrainerSession must be used within TrainerSessionProvider',
    )
  return ctx
}
