import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PageTransitionProps {
  children: React.ReactNode;
  locationKey: string;
}

const variants = {
  initial: { opacity: 0, x: 48, y: 0 },
  animate: { opacity: 1, x: 0, y: 0, transition: { duration: 0.38, ease: "easeOut" } },
  exit: { opacity: 0, x: -48, y: 0, transition: { duration: 0.28, ease: "easeIn" } },
};

export const PageTransition: React.FC<PageTransitionProps> = ({ children, locationKey }) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={locationKey}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        minHeight: 0,
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);
