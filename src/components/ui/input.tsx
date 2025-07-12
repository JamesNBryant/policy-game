import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring',
        className
      )}
      {...props}
    />
  )
}
