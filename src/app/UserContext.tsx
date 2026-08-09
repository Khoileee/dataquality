import { createContext, useContext, useState, type ReactNode } from 'react'
import { DEMO_USERS, DEFAULT_USER_ID, type DemoUser } from '@/config'

const Ctx = createContext<{ user: DemoUser; setUserId: (id: string) => void }>({
  user: DEMO_USERS[0],
  setUserId: () => {},
})

export function UserProvider({ children }: { children: ReactNode }) {
  const [id, setUserId] = useState(DEFAULT_USER_ID)
  const user = DEMO_USERS.find(u => u.id === id) ?? DEMO_USERS[0]
  return <Ctx.Provider value={{ user, setUserId }}>{children}</Ctx.Provider>
}

export const useUser = () => useContext(Ctx)
