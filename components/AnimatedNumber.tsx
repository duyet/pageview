import { useEffect, useRef } from 'react'
import CountUp from 'react-countup'

interface AnimatedNumberProps {
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
  separator?: string
}

export function AnimatedNumber({
  value,
  duration = 1,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  separator = ',',
}: AnimatedNumberProps) {
  const previousValue = useRef(0)

  useEffect(() => {
    previousValue.current = value
  }, [value])

  return (
    <CountUp
      start={previousValue.current}
      end={value}
      duration={duration}
      decimals={decimals}
      prefix={prefix}
      suffix={suffix}
      separator={separator}
      className={className}
      preserveValue
    />
  )
}
