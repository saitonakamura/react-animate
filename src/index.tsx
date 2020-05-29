import React, { useCallback, useState, useRef } from 'react'

interface Options extends KeyframeAnimationOptions {}

const nonStylesKeyframeKeys: Array<keyof Keyframe> = [
  'composite',
  'easing',
  'offset',
]

// type UseAnimate = <T extends Keyframe>(
//   keyframes: T[] & { 0: T },
//   options?: Options,
// ) => [(el: HTMLElement | null) => void, React.CSSProperties]

type WithoutKeyframeKeys<T extends Keyframe> = Omit<
  T,
  'composite' | 'easing' | 'offset'
>

const updateStyleFromKeyframe = <T extends Keyframe & React.CSSProperties>(
  keyframe: T,
  el: HTMLElement,
): WithoutKeyframeKeys<T> => {
  const filteredStyles = Object.entries(keyframe).filter(
    ([key]) => !nonStylesKeyframeKeys.includes(key),
  )

  filteredStyles.forEach(([key, value]) => {
    // @ts-ignore
    el.style[key] = value
  })

  return (Object.fromEntries(filteredStyles) as unknown) as WithoutKeyframeKeys<
    T
  >
}

const runAnimation = <T extends Keyframe & React.CSSProperties>(
  keyframes: T[],
  options: Options,
  onStart: (styles: WithoutKeyframeKeys<T>) => void,
  onFinish: (styles: WithoutKeyframeKeys<T>) => void,
  el: HTMLElement,
) => {
  if (keyframes.length <= 0) {
    return
  }
  const lastIndex = keyframes.length - 1

  const from = lastIndex > 0 ? keyframes[0] : undefined
  const to = keyframes[lastIndex]

  if (from) {
    const styles = updateStyleFromKeyframe(from, el)
    onStart(styles)
  }

  const animation = el.animate(keyframes, options)
  // animation.

  animation.onfinish = () => {
    if ('commitStyles' in animation) {
      ;(animation as { commitStyles: () => void }).commitStyles()
    }
    const styles = updateStyleFromKeyframe(to, el)
    onFinish(styles)
  }

  return animation
}

export const useAnimate = <T extends Keyframe & React.CSSProperties>(
  keyframes: T[] & { 0: T },
  options: Options,
  conditional: boolean,
): [
  (el: HTMLElement | null) => void,
  React.CSSProperties | undefined,
  boolean,
] => {
  const [style, setStyle] = useState<React.CSSProperties | undefined>(
    keyframes.length > 1
      ? updateStyleFromKeyframe(keyframes[0], { style: {} } as HTMLElement)
      : undefined,
  )

  const conditionalRef = useRef(conditional)
  const elRef = useRef<HTMLElement | null>(null)
  const animationRunningRef = useRef(false)
  const animationRef = useRef<Animation>()
  const unmountAnimationRunningRef = useRef(false)

  const setRef = useCallback((el: HTMLElement | null) => {
    if (el && !animationRunningRef.current) {
      if (animationRunningRef.current && animationRef.current) {
        animationRef.current.cancel()
      }

      animationRef.current = runAnimation(
        keyframes,
        options,
        (fromStyles) => {
          animationRunningRef.current = true
          setStyle(fromStyles)
        },
        (toStyles) => {
          animationRunningRef.current = false
          animationRef.current = undefined
          setStyle(toStyles)
        },
        el,
      )

      elRef.current = el
    } else {
      // elRef.current = null
    }
  }, [])

  if (!conditionalRef.current && conditional) {
    conditionalRef.current = true
  } else if (conditionalRef.current && !conditional) {
    if (elRef.current) {
      let time: number | null = null
      if (animationRunningRef.current && animationRef.current) {
        time = animationRef.current.currentTime
        animationRef.current.cancel()
        // debugger
      }

      animationRef.current = runAnimation(
        [...keyframes].reverse(),
        time &&
          options.duration &&
          typeof options.duration === 'number' &&
          options.duration > 0
          ? {
              ...options,
              iterationStart: 1 - time / options.duration,
              iterations:
                (options.iterations ?? 1) - (1 - time / options.duration),
            }
          : options,
        (_fromStyles) => {
          animationRunningRef.current = true
          unmountAnimationRunningRef.current = true
        },
        (_toStyles) => {
          animationRunningRef.current = false
          conditionalRef.current = false
          unmountAnimationRunningRef.current = false
        },
        elRef.current,
      )
    }
  }
  if (conditional && unmountAnimationRunningRef.current && elRef.current) {
    // debugger
    let time: number | null = null
    if (animationRunningRef.current && animationRef.current) {
      time = animationRef.current.currentTime
      animationRef.current.cancel()
    }

    animationRef.current = runAnimation(
      keyframes,
      time &&
        options.duration &&
        typeof options.duration === 'number' &&
        options.duration > 0
        ? {
            ...options,
            iterationStart: 1 - time / options.duration,
            iterations:
              (options.iterations ?? 1) - (1 - time / options.duration),
          }
        : options,
      (fromStyles) => {
        animationRunningRef.current = true
      },
      (toStyles) => {
        animationRunningRef.current = false
        animationRef.current = undefined
      },
      elRef.current,
    )

    conditionalRef.current = true
  }

  return [setRef, style, conditionalRef.current]
}
