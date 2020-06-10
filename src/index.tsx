import React, { useCallback, useState, useRef } from 'react'

interface Options extends KeyframeAnimationOptions {}

const nonStylesKeyframeKeys: Array<keyof Keyframe> = [
  'composite',
  'easing',
  'offset',
]

type WithoutKeyframeKeys<T extends Keyframe> = Omit<
  T,
  'composite' | 'easing' | 'offset'
>

const filterStyles = <T extends Keyframe & React.CSSProperties>(
  keyframe: T,
): WithoutKeyframeKeys<T> => {
  const filteredStyles = {} as WithoutKeyframeKeys<T>

  Object.keys(keyframe).forEach((key: keyof T) => {
    if (
      nonStylesKeyframeKeys.some(
        (nonStylesKeyframeKey) => nonStylesKeyframeKey === key,
      )
    ) {
      return
    }

    // @ts-ignore
    filteredStyles[key] = keyframe[key]
  })

  return filteredStyles
}

type AnimationRunningDirection = 'none' | 'forward' | 'backwards'

export const useAnimate = <T extends Keyframe & React.CSSProperties>(
  keyframes: T[] & { 0: T; 1: T },
  options: Options,
  conditional: boolean,
): [
  (el: HTMLElement | null) => void,
  React.CSSProperties | undefined,
  boolean,
] => {
  const [style, setStyle] = useState<React.CSSProperties | undefined>(
    filterStyles(keyframes[0]),
  )

  const lastIndex = keyframes.length - 1

  const from = keyframes[0]
  const to = keyframes[lastIndex]
  const fromStyles = filterStyles(from)
  const toStyles = filterStyles(to)

  const conditionalRef = useRef(conditional)
  const elRef = useRef<HTMLElement | null>(null)
  const animationRunningDirectionRef = useRef<AnimationRunningDirection>('none')
  const animationRef = useRef<Animation>()

  const setRef = useCallback(
    (el: HTMLElement | null) => {
      if (el) {
        elRef.current = el
        if (conditional && animationRunningDirectionRef.current === 'none') {
          animationRunningDirectionRef.current = 'forward'
          setStyle(fromStyles)
          animationRef.current = el.animate(keyframes, options)
          animationRef.current.onfinish = () => {
            animationRunningDirectionRef.current = 'none'
            setStyle(toStyles)
          }
        }
      } else {
        elRef.current = null
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conditional],
  )

  console.log(
    { conditional },
    conditionalRef.current,
    animationRunningDirectionRef.current,
    animationRef.current,
  )

  if (!conditionalRef.current && conditional) {
    conditionalRef.current = true

    if (animationRunningDirectionRef.current === 'none' && elRef.current) {
      debugger
      animationRunningDirectionRef.current = 'forward'
      setStyle(fromStyles)
      animationRef.current = elRef.current.animate(keyframes, options)
      animationRef.current.onfinish = () => {
        animationRunningDirectionRef.current = 'none'
        setStyle(toStyles)
      }
    }
  } else if (conditionalRef.current && !conditional) {
    if (
      (animationRunningDirectionRef.current === 'forward' ||
        animationRunningDirectionRef.current === 'none') &&
      animationRef.current
    ) {
      animationRunningDirectionRef.current = 'backwards'
      animationRef.current.onfinish = () => {
        conditionalRef.current = false
        animationRunningDirectionRef.current = 'none'
        setStyle(fromStyles)
      }
      animationRef.current.reverse()
    }
  } else if (
    animationRunningDirectionRef.current === 'backwards' &&
    conditionalRef.current &&
    conditional &&
    animationRef.current
  ) {
    animationRunningDirectionRef.current = 'forward'
    animationRef.current.onfinish = () => {
      animationRunningDirectionRef.current = 'none'
      setStyle(toStyles)
    }
    animationRef.current.reverse()
    // conditionalRef.current = true
  }

  return [setRef, style, conditionalRef.current]
}
