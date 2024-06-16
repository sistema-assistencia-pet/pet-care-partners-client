import React from 'react'

export const DetailsField = ({
  bgColor = "bg-background",
  label,
  value,
  width = "w-full",
  children
}: {
  bgColor?: string,
  label?: string,
  value?: string | number,
  width?: string,
  children?: React.ReactNode
}) => (
  <div
    className={`flex flex-col gap-2 ${bgColor} border rounded-md py-2 px-4 ${width}`}
    title={value?.toString()}
  >
    <span className="text-sm font-semibold">{label}</span>
    { value && <span className="overflow-hidden text-ellipsis whitespace-nowrap text-wrap">{value}</span>}
    {children}
  </div>
)
