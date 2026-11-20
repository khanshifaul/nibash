import * as React from "react"
import { FiSun, FiMoon, FiMonitor } from "react-icons/fi"
import { cn } from "../../lib/utils"

interface ThemeSwitcherProps {
    onThemeChange?: (theme: string) => void
    className?: string
}

export function ThemeSwitcher({ onThemeChange, className }: ThemeSwitcherProps) {
    const [theme, setThemeState] = React.useState<string>("light")
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
        const stored = localStorage.getItem("theme") || "light"
        setThemeState(stored)
    }, [])

    const setTheme = (newTheme: string) => {
        setThemeState(newTheme)
        localStorage.setItem("theme", newTheme)
        if (newTheme === "dark") {
            document.documentElement.classList.add("dark")
        } else {
            document.documentElement.classList.remove("dark")
        }
        onThemeChange?.(newTheme)
    }

    const toggleTheme = () => {
        if (theme === "light") {
            setTheme("dark")
        } else if (theme === "dark") {
            setTheme("system")
        } else {
            setTheme("light")
        }
    }

    const getIcon = () => {
        if (!mounted) {
            return <FiSun className="mr-2 h-4 w-4" />
        }
        if (theme === "system") {
            return <FiMonitor className="mr-2 h-4 w-4" />
        }
        if (theme === "dark") {
            return <FiMoon className="mr-2 h-4 w-4" />
        }
        return <FiSun className="mr-2 h-4 w-4" />
    }

    const getLabel = () => {
        if (!mounted) return "Theme"
        if (theme === "system") return "System"
        if (theme === "dark") return "Dark"
        return "Light"
    }

    return (
        <button
            onClick={toggleTheme}
            className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer",
                className
            )}
        >
            {getIcon()}
            <span>Theme: {getLabel()}</span>
        </button>
    )
}