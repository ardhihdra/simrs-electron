export const Visibility = ({
  visible,
  children
}: {
  visible: boolean
  children: React.ReactNode
}) => {
  return visible ? <>{children}</> : null
}
