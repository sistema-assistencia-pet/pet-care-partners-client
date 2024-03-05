export const InputContainer = ({ children, size }: { children: React.ReactNode, size?: string }) => (
  <div className={`flex flex-col ${size || 'grow'} space-y-1.5 my-2`}>
    {children}
  </div>
)
