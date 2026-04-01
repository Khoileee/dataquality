import { cn } from '@/lib/utils'
import { TextareaHTMLAttributes, forwardRef } from 'react'
const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn('flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 placeholder:text-gray-400 resize-none', className)} {...props} />
  )
)
Textarea.displayName = 'Textarea'
export { Textarea }
