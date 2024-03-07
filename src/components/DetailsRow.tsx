export const DetailsRow = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`${className} flex gap-4 grow`}>
    {children}
  </div>
)
