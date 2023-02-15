import { useState } from 'react'
import { motion } from 'framer-motion'

function AnimationBanner() {
    const [rotate, setRotate] = useState(false);

  return (
    <motion.div animate={{rotate: rotate ? 360 : 0}} onClick={() => setRotate(!rotate)} class="bg-blue-700 w-24 h-24 rounded-xl my-24 mx-auto"></motion.div>
  )
}

export default AnimationBanner