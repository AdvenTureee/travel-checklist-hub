
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Set initial value
    checkIsMobile()
    
    // Add event listener
    window.addEventListener("resize", checkIsMobile)
    
    // Clean up
    return () => window.removeEventListener("resize", checkIsMobile)
  }, [])

  return !!isMobile
}

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<"xs" | "sm" | "md" | "lg" | "xl">("md")

  React.useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth
      if (width < 640) {
        setBreakpoint("xs")
      } else if (width < 768) {
        setBreakpoint("sm")
      } else if (width < 1024) {
        setBreakpoint("md")
      } else if (width < 1280) {
        setBreakpoint("lg")
      } else {
        setBreakpoint("xl")
      }
    }
    
    // Set initial value
    checkBreakpoint()
    
    // Add event listener
    window.addEventListener("resize", checkBreakpoint)
    
    // Clean up
    return () => window.removeEventListener("resize", checkBreakpoint)
  }, [])

  return breakpoint
}
