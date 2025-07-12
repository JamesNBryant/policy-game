import { cn } from '@/lib/utils'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export function Button({ className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}