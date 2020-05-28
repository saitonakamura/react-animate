import 'react-app-polyfill/ie11'
import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import { useAnimate } from '../.'

const Hello = ({ show }: { show: boolean }) => {
  const [setRef, styles, showNew] = useAnimate(
    [
      { opacity: 0, transform: 'translate(0, 0)' },
      { opacity: 1, transform: 'translate(500px, 0px)' },
      { opacity: 1, transform: 'translate(100px, 50px)' },
    ],
    {
      duration: 1000,
      easing: 'ease-in-out',
      iterations: 1,
    },
    show,
  )

  return showNew ? (
    <div ref={setRef} style={styles}>
      Hello
    </div>
  ) : null
}

const App = () => {
  const [show, setShow] = useState(false)

  return (
    <>
      <button onClick={() => setShow(!show)}>toggle</button>
      <Hello show={show} />
    </>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
