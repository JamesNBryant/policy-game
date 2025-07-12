import { Button as ShadButton } from 'shadcn/ui/button'

export const Button = (props: React.ComponentProps<typeof ShadButton>) => {
  return <ShadButton {...props} />
}
