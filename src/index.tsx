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

  animation.onfinish = () => {
    const styles = updateStyleFromKeyframe(to, el)
    onFinish(styles)
  }
}

export const useAnimate = <T extends Keyframe & React.CSSProperties>(
  keyframes: T[] & { 0: T },
  options: Options,
  conditional: boolean,
): [(el: HTMLElement | null) => void, React.CSSProperties | null, boolean] => {
  const [style, setStyle] = useState<React.CSSProperties | null>(
    keyframes.length > 1
      ? updateStyleFromKeyframe(keyframes[0], { style: {} } as HTMLElement)
      : null,
  )

  const conditionalRef = useRef(conditional)
  const elRef = useRef<HTMLElement | null>(null)
  const animationRunningRef = useRef(false)

  const setRef = useCallback(
    (el: HTMLElement | null) => {
      if (el && !animationRunningRef.current) {
        runAnimation(
          keyframes,
          options,
          (fromStyles) => {
            setStyle(fromStyles)
            animationRunningRef.current = true
          },
          (toStyles) => {
            setStyle(toStyles)
            animationRunningRef.current = false
          },
          el,
        )
        elRef.current = el
      } else {
        elRef.current = null
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conditional],
  )

  if (!conditionalRef.current && conditional) {
    conditionalRef.current = true
  } else if (conditionalRef.current && !conditional) {
    if (elRef.current && !animationRunningRef.current) {
      runAnimation(
        [...keyframes].reverse(),
        options,
        (_fromStyles) => {
          animationRunningRef.current = true
        }, //etStyle(fromStyles),
        (_toStyles) => {
          // setStyle(toStyles)
          animationRunningRef.current = false
          conditionalRef.current = false
        },
        elRef.current,
      )
    }
  }

  return [setRef, style, conditionalRef.current]
}
