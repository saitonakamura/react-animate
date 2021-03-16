import React from 'react'

export const Block = ({
  innerRef,
}: {
  innerRef: React.Ref<HTMLDivElement>
}) => (
  <div
    ref={innerRef}
    style={{
      backgroundColor: 'teal',
      width: '50px',
      height: '20px',
      borderRadius: '5px',
    }}
  />
)
