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
  const lastIndex = keyframes.length - 1

  const from = keyframes[0]
  const to = keyframes[lastIndex]
  const fromStyles = filterStyles(from)
  const toStyles = filterStyles(to)

  const [style, setStyle] = useState<React.CSSProperties | undefined>(
    conditional ? toStyles : fromStyles,
    // undefined,
  )

  const currentConditionalCopyRef = useRef(conditional)
  currentConditionalCopyRef.current = conditional

  const conditionalRef = useRef(conditional)
  const elRef = useRef<HTMLElement | null>(null)
  const animationRunningDirectionRef = useRef<AnimationRunningDirection>('none')
  const animationRef = useRef<Animation>()
  const onFinishRef = useRef<Animation['onfinish']>()

  const handleFinishForward = function(this: Animation) {
    console.timeEnd('forward')
    animationRunningDirectionRef.current = 'none'
    setStyle(toStyles)
    // this.removeEventListener('finish', handleFinishForward)
  }

  const handleFinishBackwards = function(this: Animation) {
    console.timeEnd('backward')
    animationRunningDirectionRef.current = 'none'
    conditionalRef.current = false
    setStyle(fromStyles)
    // this.removeEventListener('finish', handleFinishBackwards)
  }

  const addFinishEventListener = (
    animation: Animation,
    callback: () => void,
  ) => {
    if (onFinishRef.current) {
      animation.removeEventListener('finish', onFinishRef.current)
    }
    onFinishRef.current = callback
    animation.addEventListener('finish', callback)
  }

  const setRef = useCallback(
    (el: HTMLElement | null) => {
      console.log('setRef', { conditional: conditional, el: !!el })
      if (el) {
        elRef.current = el
        if (
          currentConditionalCopyRef.current &&
          animationRunningDirectionRef.current === 'none'
        ) {
          animationRunningDirectionRef.current = 'forward'
          // setStyle(fromStyles)
          animationRef.current = el.animate(keyframes, {
            // fill: 'both',
            ...options,
          })

          addFinishEventListener(animationRef.current, handleFinishForward)
        }
      } else {
        elRef.current = null
      }
    },
    // [conditional],
    [],
  )

  console.log(
    { conditional },
    conditionalRef.current,
    animationRunningDirectionRef.current,
    // animationRef.current,
  )

  if (!conditionalRef.current && conditional) {
    console.log('start')
    conditionalRef.current = true

    if (animationRunningDirectionRef.current === 'none' && elRef.current) {
      animationRunningDirectionRef.current = 'forward'
      // setStyle(fromStyles)
      console.time('forward')
      animationRef.current = elRef.current.animate(keyframes, {
        // fill: 'forwards',
        ...options,
      })

      addFinishEventListener(animationRef.current, handleFinishForward)
    }
  } else if (
    conditionalRef.current &&
    !conditional &&
    animationRunningDirectionRef.current === 'forward' &&
    animationRef.current
  ) {
    console.log('reverse from forward')
    console.time('backward')
    animationRunningDirectionRef.current = 'backwards'
    addFinishEventListener(animationRef.current, handleFinishBackwards)
    animationRef.current.reverse()
  } else if (
    conditionalRef.current &&
    !conditional &&
    animationRunningDirectionRef.current === 'none' &&
    animationRef.current &&
    elRef.current
  ) {
    console.log('reverse from none')
    console.time('backward')
    animationRunningDirectionRef.current = 'backwards'
    // animationRef.current = elRef.current.animate(keyframes, {
    //   // fill: 'forwards',
    //   direction: 'reverse',
    //   ...options,
    // })

    addFinishEventListener(animationRef.current, handleFinishBackwards)
    animationRef.current.reverse()
  } else if (
    animationRunningDirectionRef.current === 'backwards' &&
    conditionalRef.current &&
    conditional &&
    animationRef.current
  ) {
    animationRunningDirectionRef.current = 'forward'
    addFinishEventListener(animationRef.current, handleFinishForward)
    animationRef.current.reverse()
    // conditionalRef.current = true
  }

  return [setRef, style, conditionalRef.current]
}
