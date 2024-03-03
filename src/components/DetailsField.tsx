import React from 'react'

export const DetailsField = ({
  label,
  value,
  width = "w-full",
  children
}: {
  label?: string,
  value?: string,
  width?: string,
  children?: React.ReactNode
}) => (
  <div
    className={`flex flex-col gap-2 bg-background border rounded-md py-2 px-4 ${width || ''}`}
    title={value}
  >
    <span className="text-sm font-semibold">{label}</span>
    { value && <span className="overflow-hidden text-ellipsis whitespace-nowrap">{value}</span>}
    {children}
  </div>
)

export const DetailsRow = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-4">
    {children}
  </div>
)
