import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command'
import { Home, BarChart3, Activity, Globe } from 'lucide-react'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const navigate = (path: string) => {
    router.push(path)
    setOpen(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          <CommandItem onSelect={() => navigate('/')}>
            <Home className="mr-2 size-4" />
            <span>Home</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/analytics')}>
            <BarChart3 className="mr-2 size-4" />
            <span>Analytics</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/realtime')}>
            <Activity className="mr-2 size-4" />
            <span>Real-time</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
