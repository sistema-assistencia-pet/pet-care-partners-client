export const InputContainer = ({ children, size }: { children: React.ReactNode, size?: string }) => (
  <div className={`flex flex-col ${size || 'grow'} space-y-1.5`}>
    {children}
  </div>
)
